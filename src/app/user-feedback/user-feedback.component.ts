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
  selectedTab : string = 'tab1'; 

  service = inject(ServicesService);

  username = this.service.getUsernameFromToken(); 

  ngOnInit(): void {
    
  }

  feedbackForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.feedbackForm = this.fb.group({
      category: ['', Validators.required],
      message: ['', Validators.required]
    });
  }
  
  submitFeedback() {
    
    if (this.feedbackForm.valid && this.username) {
      this.http.post(`http://localhost:8181/api/v1/send-feedback?username=${this.username}`, 
        this.feedbackForm.value
      ).subscribe({
        next: () => alert('Feedback sent successfully'),
        error: (err) => alert('Error: ' + err.message)
      });
    }
  }
}
