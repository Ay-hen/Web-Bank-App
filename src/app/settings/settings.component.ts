import { Component, inject, OnInit } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";
import { UserDashboardComponent } from "../user-dashboard/user-dashboard.component";
import { ServicesService } from '../services/services.service';
import { HttpClient } from '@angular/common/http';

type User = {
    name: string,
    email: string;
    role: string;
    status: string;
    createdDate: string;
  }

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [DashboardNavbarComponent, UserDashboardComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  role = localStorage.getItem('role')?.toUpperCase();

  user : any;

  service = inject(ServicesService);
  http = inject(HttpClient);

  languages = ['English', 'French', 'German'];
  selectedLanguage = localStorage.getItem('language') || this.languages[0];

  ngOnInit(): void {
    // Load language from storage if available
    const lang = localStorage.getItem('language');
    const username = this.service.getUsernameFromToken();

    this.http.get(`http://localhost:8181/api/v1/user-details?username=${username}`).subscribe({
      next: (response: any) => {
        this.user = response;
        console.log(this.user);
        console.log("response from backend", response);
      }
    });

    if (lang && this.languages.includes(lang)) {
      this.selectedLanguage = lang;
    }
  }

  onLanguageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedLanguage = select.value;
  }
}