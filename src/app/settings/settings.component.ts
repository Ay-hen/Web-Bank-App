import { Component, OnInit } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";
import { UserDashboardComponent } from "../user-dashboard/user-dashboard.component";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [DashboardNavbarComponent, UserDashboardComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent  {
  role = localStorage.getItem('role');
}
