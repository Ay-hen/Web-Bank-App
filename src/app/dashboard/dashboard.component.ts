import { Component } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DashboardNavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  
}
