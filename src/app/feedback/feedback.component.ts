import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";
import jsPDF from 'jspdf';
import { ServicesService } from '../services/services.service';
import { HttpClient, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';



type Feedback = {
  id: number;
  name: string;
  category: string;
  creationDate: string;
  message: string;
  status: string;
}


@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [DashboardNavbarComponent],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.scss'
})
export class FeedbackComponent implements OnInit {

  isDownloading = signal<{ csv: boolean, pdf: boolean }>({ csv: false, pdf: false });
  downloadProgress = signal<{ csv: number, pdf: number }>({ csv: 0, pdf: 0 });

  downloadFeedbacks(type: 'csv' | 'pdf', username: string) {
      // Set loading state
      this.isDownloading.update(state => ({ ...state, [type]: true }));
      this.downloadProgress.update(state => ({ ...state, [type]: 0 }));
  
      const apiUrl = `http://localhost:8181/api/v1/user/${username}/feedback/${type}`;
  
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

  username = signal('');

  service = inject(ServicesService);
  http = inject(HttpClient);

  ngOnInit(): void {
      this.service.getFeedbacks().subscribe((data: Feedback[]) => {
        this.feedbacks.set(data);
        console.log(this.feedbacks());
      });

      this.updatedStatus = this.selectedFeedback()?.status || '';

  }


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

  
  this.http.get<any[]>(`http://localhost:8181/api/v1/users?search=${encodeURIComponent(searchTerm)}`)
    .subscribe({
      next: (users) => {
        console.log('Fetched users : ', users);
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
  

  
  




submitReply() {
throw new Error('Method not implemented.');
}

  selectedFeedback = signal<Feedback | null>(null);
  activeTab = signal<'tab1' | 'tab2'>('tab1');

  replyToFeedback(feedback: Feedback) {
    this.selectedFeedback.set(feedback);
    this.selectedTab = 'tab2';
  }
  selectedTab : string = 'tab1';
  searchQuery = signal('');
    sortBy = signal('newest');
    activeFeedback = signal<any>(null);
    showReportPopover = signal(false);

    currentPage = signal(0);
    currantPageIndex = signal(0); 
    itemsPerPage = 4;  

  feedbacks = signal<any[]>([]);

  filteredFeedbacks = computed(() => {
      const query = this.searchQuery().toLowerCase();
      const sort = this.sortBy();
      const page = this.currentPage();
      const perPage = this.itemsPerPage;
    
      // Start with full list
      let list = this.feedbacks();
    
      // Filter
      if (query) {
        list = list.filter(feedback =>
          feedback.name.toLowerCase().includes(query) ||
          feedback.category.toLowerCase().includes(query) ||
          feedback.message.includes(query)
        );
      }
    
      // Sort
      if (sort === 'newest') {
        list = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else if (sort === 'oldest') {
        list = [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
    
      // Paginate
      const startIndex = page * perPage;
      return list.slice(startIndex, startIndex + perPage);
    });
    
  
    goToNextPage() {
      const maxPage = Math.floor(this.feedbacks().length / this.itemsPerPage);
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
      return Math.ceil(this.feedbacks().length / this.itemsPerPage);
    }
    
    
    hasPreviousPage(): boolean {
      return this.currentPage() > 0;
    }
    
    hasNextPage(): boolean {
      return this.currentPage() < this.totalPages() - 1;
    }

    setStatus(feedback: any, status: string) {
      feedback.status = status;
    }

    toggleMore(feedback : Feedback){

      if (this.activePopoverFeedback() === feedback) {
        this.activePopoverFeedback.set(null); 
      } else {
        this.activePopoverFeedback.set(feedback);
      }
    }

    activePopoverFeedback = signal<Feedback | null>(null);

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.more-wrapper')) {
            this.activePopoverFeedback.set(null);
        }
    }

    selectedMessage = signal<Feedback | null>(null);

    openMessagePopup(feedback: Feedback) {
      this.selectedMessage.set(feedback);
    }
  
    closePopup() {
      this.selectedMessage.set(null);
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

  isEditingStatus: boolean = false;
  updatedStatus: string = '';
  saveStatus() {
    const feedback = this.selectedFeedback();
    if (feedback) {
      feedback.status = this.updatedStatus;
      this.isEditingStatus = false;
    }
  }
  
  showId: boolean = false;
}
