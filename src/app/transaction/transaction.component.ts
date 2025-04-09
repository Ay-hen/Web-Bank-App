import { AfterViewInit, Component, computed, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";
import jsPDF from 'jspdf';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type Transaction = {
  id: number;
  senderName: string;
  amount: number;
  recepientName: string;
  creationDate: string;
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
  private previousTab: string = '';

  ngOnInit(): void {
    // Initialization logic if needed
  }

  ngAfterViewInit(): void {
    // Only try to render chart if we're on the visualization tab
    if (this.selectedTab === 'tab3') {
      setTimeout(() => this.renderChart(), 0);
    }
  }

  setTab(tabName: string): void {
    this.previousTab = this.selectedTab;
    this.selectedTab = tabName;
    
    // If switching to visualization tab, render the chart
    if (tabName === 'tab3') {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => this.renderChart(), 0);
    }
  }

  renderChart() {
    if (!this.chartCanvas) {
      console.error('Chart canvas not found');
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context from canvas');
      return;
    }
    
    // Group data by month for better visualization
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const monthlyData = new Array(12).fill(0);
    
    this.transactions().forEach(transaction => {
      const date = new Date(transaction.creationDate);
      const month = date.getMonth(); // 0-11
      monthlyData[month] += transaction.amount;
    });

    // Destroy previous chart if exists
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
          tension: 0.4, //  Makes the line curved
          fill: true,   // Optional: fills under the line for a path-like look
          pointRadius: 4,
          pointBackgroundColor: 'rgba(79, 70, 229, 1)',
          pointBorderColor: '#fff',
        }]
        
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
        
      
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

  private convertToCSV(data: Transaction[]): string {
    const headers = ['ID', 'Sender', 'Recipient', 'Amount', 'Date', 'Status'];
    const rows = data.map(f =>
      [f.id, f.senderName, f.recepientName, f.amount, f.creationDate, f.status].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
  
  downloadTransactions(type: 'csv' | 'pdf', username: string) {
    const data = this.transactions().filter(f =>
      f.senderName.toLowerCase() === username.toLowerCase() || 
      f.recepientName.toLowerCase() === username.toLowerCase()
    );
  
    if (data.length === 0) {
      alert('No transactions found for this user');
      return;
    }
  
    if (type === 'csv') {
      const csv = this.convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${username}_feedbacks.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (type === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(12);
      doc.text(`Transactions for ${username}`, 10, 10);
    
      let y = 20;
      data.forEach((f, index) => {
        doc.text(`${index + 1}. Sender: ${f.senderName}`, 10, y);
        y += 8;
        doc.text(`   Recipient: ${f.recepientName}`, 10, y);
        y += 8;
        doc.text(`   Amount: $${f.amount}`, 10, y);
        y += 8;
        doc.text(`   Date: ${f.creationDate}`, 10, y);
        y += 8;
        doc.text(`   Status: ${f.status}`, 10, y);
        y += 12;
    
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    
      doc.save(`${username}_transactions.pdf`);
    }
  }

  username = signal('');
  searchQuery = signal('');
  selectedTab: string = 'tab1';

  sortBy = signal('newest');
  activeFeedback = signal<any>(null);
  showReportPopover = signal(false);
  
  currentPage = signal(0);
  currantPageIndex = signal(0); 
  itemsPerPage = 4;  

  transactions = signal([
    {
      id: 1,
      senderName: 'John Doe',
      amount: 100,
      recepientName: 'Jane Smith',
      creationDate: '2023-10-01',
      status: 'completed'
    },
    {
      id: 2,
      senderName: 'Alice Johnson',
      amount: 200,
      recepientName: 'Bob Brown',
      creationDate: '2023-09-15',
      status: 'pending'
    },
    {
      id: 3,
      senderName: 'Charlie Green',
      amount: 150,
      recepientName: 'Diana Prince',
      creationDate: '2023-08-20',
      status: 'failed'
    },
    {
      id: 4,
      senderName: 'Eve Adams',
      amount: 250,
      recepientName: 'Frank Castle',
      creationDate: '2023-07-10',
      status: 'completed'
    },
    {
      id: 5,
      senderName: 'George Washington',
      amount: 300,
      recepientName: 'Hannah Montana',
      creationDate: '2023-06-05',
      status: 'pending'
    },
    {
      id: 6,
      senderName: 'Ivy League',
      amount: 700,
      recepientName: 'Jack Sparrow',
      creationDate: '2023-05-25',
      status: 'failed'
    },
    {
      id: 7,
      senderName: 'Katherine Johnson',
      amount: 500,
      recepientName: 'Leonardo DiCaprio',
      creationDate: '2023-04-15',
      status: 'completed'
    },
    {
      id: 8,
      senderName: 'Michael Jordan',
      amount: 600,
      recepientName: 'John Doe',
      creationDate: '2023-03-10',
      status: 'pending'
    },
    {
      id: 9,
      senderName: 'Oscar Wilde',
      amount: 500,
      recepientName: 'Pablo Picasso',
      creationDate: '2023-02-05',
      status: 'failed'
    },
    {
      id: 10,
      senderName: 'Quentin Tarantino',
      amount: 10,
      recepientName: 'Rihanna',
      creationDate: '2023-01-01',
      status: 'completed'
    },
  ]);

  filteredTransactions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const sort = this.sortBy();
    const page = this.currentPage();
    const perPage = this.itemsPerPage;
  
    // Start with full list
    let list = this.transactions();
  
    // Filter
    if (query) {
      list = list.filter(transaction =>
        transaction.senderName.toLowerCase().includes(query) ||
        transaction.recepientName.toLowerCase().includes(query) ||
        transaction.creationDate.includes(query) ||
        transaction.status.toLowerCase().includes(query)
      );
    }
  
    // Sort
    if (sort === 'newest') {
      list = [...list].sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
    } else if (sort === 'oldest') {
      list = [...list].sort((a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime());
    }
  
    // Paginate
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

  setStatus(transaction: any, status: string) {
    transaction.status = status;
  }

  tooltipVisible = signal(false);
  tooltipX = signal(0);
  tooltipY = signal(0);

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

  csvTooltipVisible = signal(false);
  csvTooltipX = signal(0);
  csvTooltipY = signal(0);

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
}