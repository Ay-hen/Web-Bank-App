import { Component, computed, HostListener, signal } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";


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
export class FeedbackComponent {
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

  feedbacks = signal([
    {id: 1, name: 'John Doe', category: 'Great service!', creationDate: '2023-10-01', message: 'Meet the OSI Model, the 7-layer cake of networking. Each layer plays a crucial role in moving data, ensuring smooth communication between devices. From physical cables (Layer 1) to web browsers (Layer 7), this model keeps the internet running!', status: 'pending'},
    {id: 2, name: 'Jane Smith', category: 'Needs improvement', creationDate: '2023-09-15', message: 'The service was okay, but there is room for improvement.', status: 'solved'},
    {id: 3, name: 'Alice Johnson', category: 'Excellent', creationDate: '2023-08-20', message: 'I am very satisfied with the service provided.', status: 'rejected'},
    {id: 4, name: 'Bob Brown', category: 'Not satisfied', creationDate: '2023-07-10', message: 'I was not happy with the service I received.', status: 'pending'},
    {id: 5, name: 'Charlie Davis', category: 'Great service!', creationDate: '2023-06-05', message: 'The service was fantastic! I will recommend it to others.', status: 'unsolved'},
    {id: 6, name: 'Diana Evans', category: 'Needs improvement', creationDate: '2023-05-15', message: 'I think the service could be better in some areas.', status: 'pending'},
    {id: 7, name: 'Ethan Foster', category: 'Excellent', creationDate: '2023-04-25', message: 'I am very pleased with the service I received.', status: 'pending'},
    {id: 8, name: 'Fiona Green', category: 'Not satisfied', creationDate: '2023-03-30', message: 'I was disappointed with the service.', status: 'pending'},
    {id: 9, name: 'George Harris', category: 'Great service!', creationDate: '2023-02-20', message: 'I had a great experience with your service.', status: 'pending'},
  ])

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
        list = [...list].sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
      } else if (sort === 'oldest') {
        list = [...list].sort((a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime());
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
      return Math.ceil(this.feedbacks.length / this.itemsPerPage);
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
      console.log(feedback);
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
  
    

}
