import { AfterViewInit, Component, computed, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";
import jsPDF from 'jspdf';
import { Chart, registerables } from 'chart.js';
import { HttpClient, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';

Chart.register(...registerables);

type Transaction = {
  id: number;
  senderName: string;
  amount: number;
  recepientName: string;
  creationDate: string;
  type: string;
  status: string;
}

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [DashboardNavbarComponent],
  templateUrl: './transaction.component.html',
  styleUrl: './transaction.component.scss'
})
export class TransactionComponent implements OnInit, AfterViewInit {
  @ViewChild('barchart') chartCanvas!: ElementRef;
  private chart?: Chart;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTransactions();
  }

  ngAfterViewInit(): void {
    if (this.selectedTab === 'tab3') {
      setTimeout(() => this.renderChart(), 0);
    }
  }

  selectedTab: string = 'tab1';
  previousTab: string = '';

  username = signal('');
  searchQuery = signal('');
  sortBy = signal('newest');
  currentPage = signal(0);
  itemsPerPage = 4;
  tooltipVisible = signal(false);
  tooltipX = signal(0);
  tooltipY = signal(0);
  csvTooltipVisible = signal(false);
  csvTooltipX = signal(0);
  csvTooltipY = signal(0);

  // ✅ Start empty and fill from API
  transactions = signal<any[]>([]);

  setTab(tabName: string): void {
    this.previousTab = this.selectedTab;
    this.selectedTab = tabName;
    if (tabName === 'tab3') {
      setTimeout(() => this.renderChart(), 0);
    }
  }

  fetchTransactions(): void {
    this.http.get<any[]>('http://localhost:8181/api/v1/transactions')
      .subscribe(data => {
        const formatted = data.map((t, index) => ({
          id: index + 1,
          senderName: t.sender || 'N/A',
          recepientName: t.recipient || 'N/A',
          amount: t.amount || 0,
          creationDate: t.date || '',
          type: (t.type || '').toLowerCase(),
          status: (t.status || '').toLowerCase()
        }));
        this.transactions.set(formatted);
      }, error => {
        console.error('Failed to fetch transactions', error);
      });
  }

  renderChart() {
    if (!this.chartCanvas) {
      console.error('Chart canvas not found');
      return;
    }
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context');
      return;
    }

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthlyData = new Array(12).fill(0);

    this.transactions().forEach(transaction => {
      const date = new Date(transaction.creationDate);
      const month = date.getMonth();
      monthlyData[month] += transaction.amount;
    });

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Transaction Amount ($)',
          data: monthlyData,
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(79, 70, 229, 1)',
          pointBorderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `$${context.raw}`;
              }
            }
          }
        }
      }
    });
  }

  filteredTransactions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const sort = this.sortBy();
    const page = this.currentPage();
    const perPage = this.itemsPerPage;

    let list = this.transactions();

    if (query) {
      list = list.filter(transaction =>
        transaction.senderName.toLowerCase().includes(query) ||
        transaction.recepientName.toLowerCase().includes(query) ||
        transaction.creationDate.includes(query) ||
        transaction.status.toLowerCase().includes(query)
      );
    }

    if (sort === 'newest') {
      list = [...list].sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
    } else if (sort === 'oldest') {
      list = [...list].sort((a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime());
    }

    const startIndex = page * perPage;
    return list.slice(startIndex, startIndex + perPage);
  });

  goToNextPage() {
    const maxPage = Math.floor(this.transactions().length / this.itemsPerPage);
    if (this.currentPage() < maxPage) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  goToPreviousPage() {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  totalPages(): number {
    return Math.ceil(this.transactions().length / this.itemsPerPage);
  }

  hasPreviousPage(): boolean {
    return this.currentPage() > 0;
  }

  hasNextPage(): boolean {
    return this.currentPage() < this.totalPages() - 1;
  }

  private convertToCSV(data: any[]): string {
    const headers = ['ID', 'Sender', 'Recipient', 'Amount', 'Date', 'Status'];
    const rows = data.map(f =>
      [f.id, f.senderName, f.recepientName, f.amount, f.creationDate, f.status].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  isDownloading = signal<{ csv: boolean, pdf: boolean }>({ csv: false, pdf: false });
  downloadProgress = signal<{ csv: number, pdf: number }>({ csv: 0, pdf: 0 });

  downloadTransactions(type: 'csv' | 'pdf', username: string) {
    // Set loading state
    this.isDownloading.update(state => ({ ...state, [type]: true }));
    this.downloadProgress.update(state => ({ ...state, [type]: 0 }));

    const apiUrl = `http://localhost:8181/api/v1/customers/${username}/transactions/${type}`;

    this.http.get(apiUrl, {
      responseType: 'blob',
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.DownloadProgress) {
          const progress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
          this.downloadProgress.update(state => ({ ...state, [type]: progress }));
        } else if (event instanceof HttpResponse) {
          const blob = event.body;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${username.replace(/\s+/g, '_')}_transactions.${type}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          // Reset states
          this.isDownloading.update(state => ({ ...state, [type]: false }));
          this.downloadProgress.update(state => ({ ...state, [type]: 0 }));
        }
      },
      error: (error) => {
      
        console.error('Download error:', error);
        this.isDownloading.update(state => ({ ...state, [type]: false }));
        this.downloadProgress.update(state => ({ ...state, [type]: 0 }));
      }
    });
  }


  showTooltip() {
    this.tooltipVisible.set(true);
  }
  hideTooltip() {
    this.tooltipVisible.set(false);
  }
  updateTooltipPosition(event: MouseEvent) {
    this.tooltipX.set(event.clientX + 12);
    this.tooltipY.set(event.clientY + 12);
  }

  showCsvTooltip() {
    this.csvTooltipVisible.set(true);
  }
  hideCsvTooltip() {
    this.csvTooltipVisible.set(false);
  }
  updateCsvTooltipPosition(event: MouseEvent) {
    this.csvTooltipX.set(event.clientX + 12);
    this.csvTooltipY.set(event.clientY + 12);
  }

  // Add these new signals
filteredUsers = signal<any[]>([]);
showUserList = signal(false);
noUsersFound = signal(false);

// Add this method to fetch users
fetchUsers(searchTerm: string): void {
  if (searchTerm.length < 1) {
    this.filteredUsers.set([]);
    this.showUserList.set(false);
    this.noUsersFound.set(false);
    return;
  }

  // IMPORTANT: send the search term to backend
  this.http.get<any[]>(`http://localhost:8181/api/v1/customers?search=${encodeURIComponent(searchTerm)}`)
    .subscribe({
      next: (users) => {
        this.filteredUsers.set(users);
        this.showUserList.set(users.length > 0);
        this.noUsersFound.set(users.length === 0);
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.filteredUsers.set([]);
        this.showUserList.set(false);
        this.noUsersFound.set(true);
      }
    });
}

// Add this method to your component class
handleBlur() {
  setTimeout(() => {
      this.showUserList.set(false);
      this.noUsersFound.set(false);
  }, 200);
}

// Update your username input handler
onUsernameInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  this.username.set(value);
  this.fetchUsers(value);
}

selectUser(user: any): void {
  this.username.set(user.username); // or whatever property contains the username
  this.filteredUsers.set([]);
  this.showUserList.set(false);
  this.noUsersFound.set(false);
}
}