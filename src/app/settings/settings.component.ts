import { Component, OnInit } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";
import { UserDashboardComponent } from "../user-dashboard/user-dashboard.component";

type User = {
    name: string,
    email: string;
    role: string;
    status: string;
    createdAt: string;
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

  user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: this.role,
    status: 'Active',
    createdAt: new Date().toISOString()
  };

  languages = ['English', 'French', 'German'];
  selectedLanguage = localStorage.getItem('language') || this.languages[0];

  ngOnInit(): void {
    // Load language from storage if available
    const lang = localStorage.getItem('language');
    if (lang && this.languages.includes(lang)) {
      this.selectedLanguage = lang;
    }
  }

  onLanguageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedLanguage = select.value;
    localStorage.setItem('language', this.selectedLanguage);
    // Optional: trigger translation logic here
  }
}