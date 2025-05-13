import { Component, computed, HostListener, Inject, inject, OnInit, signal } from '@angular/core';
import { UserDashboardComponent } from "../user-dashboard/user-dashboard.component";
import { ServicesService } from "../services/services.service";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type Feedback = {
  id: number;
  name: string;
  category: string;
  creationDate: string;
  message: string;
  status: string;
  answer: string;
}

@Component({
  selector: 'app-user-feedback',
  standalone: true,
  imports: [UserDashboardComponent,ReactiveFormsModule],
  templateUrl: './user-feedback.component.html',
  styleUrl: './user-feedback.component.scss'
})
export class UserFeedbackComponent implements OnInit {
  selectedTab: string = 'tab1'; 
  feedbackForm: FormGroup;

  service = inject(ServicesService);

  username = this.service.getUsernameFromToken();

  feedbackSent: boolean = false; 
  errorMessage: string | null = null; // Optional: handle error

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.feedbackForm = this.fb.group({
      category: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.fetchFeedbacks();
  }

  fetchFeedbacks() {
    this.http.get<Feedback[]>(`http://localhost:8181/api/v1/${this.username}/feedbacks`)
      .subscribe((data) => {
        console.log(data);
        this.feedbacks.set(data.map((feedback, index) => ({
          ...feedback,
          id: index + 1, 
          creationDate: new Date(feedback.creationDate).toLocaleDateString() 
        })));
      });
  }

  submitFeedback() {
    this.feedbackSent = false;
    this.errorMessage = null;
  
    if (this.feedbackForm.valid && this.username) {
      this.http.post(
        `http://localhost:8181/api/v1/send-feedback?username=${this.username}`, 
        this.feedbackForm.value, 
        { responseType: 'text' } 
      ).subscribe({
        next: () => {
          this.feedbackSent = true;
          this.feedbackForm.reset();
          setTimeout(() => this.feedbackSent = false, 5000);
          this.fetchFeedbacks(); 
        },
        error: (err) => {
          this.errorMessage = err.message;
          setTimeout(() => this.errorMessage = null, 5000); 
        }
      });
    }
  }

  currentPage = signal(0);
  currantPageIndex = signal(0); 
  itemsPerPage = 4;  
  
  feedbacks = signal<any[]>([]);
  
  searchQuery = signal('');
  sortBy = signal('newest');
  
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
      
      openAnswerPopup(answer: any) {
        this.selectedAnswer.set(answer);
      }
    
      selectedAnswer = signal<Feedback | null>(null);
      closePopup() {
        this.selectedMessage.set(null);
      }
  
}
