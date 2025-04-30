import { Component, inject, OnInit } from '@angular/core';
import { UserDashboardComponent } from "../user-dashboard/user-dashboard.component";
import { ServicesService } from "../services/services.service";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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

  ngOnInit(): void {}

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
        },
        error: (err) => {
          this.errorMessage = err.message;
          setTimeout(() => this.errorMessage = null, 5000); 
        }
      });
    }
  }
  
}
