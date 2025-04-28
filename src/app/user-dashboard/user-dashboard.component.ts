import { Component, inject } from '@angular/core';
import { ServicesService } from '../services/services.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss'
})
export class UserDashboardComponent {
  private auth = inject(ServicesService);
  private router = inject(Router);


  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

}
