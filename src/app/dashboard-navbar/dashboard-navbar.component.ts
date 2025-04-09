import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [RouterLink,RouterLinkActive],
  templateUrl: './dashboard-navbar.component.html',
  styleUrl: './dashboard-navbar.component.scss'
})
export class DashboardNavbarComponent {
  logout() {
    throw new Error('Method not implemented.');
  }

  navItems = [
    { path: '/dashboard', icon: 'icons/dashboard.svg', label: 'Dashboard', permission: 'VIEW_DASHBOARD' },
    { path: '/users', icon: 'icons/customer.svg', label: 'User Management', permission: 'MANAGE_USERS' },
    { path: '/feedback', icon: 'icons/feedback.svg', label: 'Feedback', permission: 'SEND_FEEDBACK' },
    { path: '/transaction', icon: 'icons/transaction.svg', label: 'Transaction' },
    { path : '/notification', icon: 'icons/notification.svg', label: 'Notification'},
    { path : '/admin-management', icon : 'icons/admin_management.svg', label: 'Admin Management'},
    { path: '/settings', icon: 'icons/setting.svg', label: 'Settings' },
    { path : '/logout', icon: 'icons/logout.svg', label: 'Logout' }
  ];
}
