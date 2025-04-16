import { Component, inject, OnInit } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";
import { ServicesService } from '../services/services.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DashboardNavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  service = inject(ServicesService);

  constructor() { } 

  ngOnInit() {
    
  }
  
}
