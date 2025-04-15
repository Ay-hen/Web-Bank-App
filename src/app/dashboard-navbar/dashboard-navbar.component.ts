import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ServicesService } from '../services/services.service';

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [RouterLink,RouterLinkActive],
  templateUrl: './dashboard-navbar.component.html',
  styleUrl: './dashboard-navbar.component.scss'
})
export class DashboardNavbarComponent {
  

  private auth = inject(ServicesService);
  private router = inject(Router);

  permissions = signal<string[]>(this.auth.getPermissionNames());

  navItems = [
    { path: '/dashboard', icon: 'icons/dashboard.svg', label: 'Dashboard', permission: 'VIEW_DASHBOARD' },
    { path: '/users', icon: 'icons/customer.svg', label: 'User Management', permission: 'MANAGE_USERS' },
    { path: '/feedback', icon: 'icons/feedback.svg', label: 'Feedback', permission: 'MANAGE_FEEDBACK' },
    { path: '/transaction', icon: 'icons/transaction.svg', label: 'Transaction', permission: 'MANAGE_TRANSACTION' },
    { path : '/notification', icon: 'icons/notification.svg', label: 'Notification', permission: 'MANAGE_NOTIFICATION' },
    { path : '/admin-management', icon : 'icons/admin_management.svg', label: 'Admin Management', permission: 'MANAGE_ADMIN' },
    { path: '/settings', icon: 'icons/setting.svg', label: 'Settings' },
    { path : '/logout', icon: 'icons/logout.svg', label: 'Logout' }
  ];

  visibleItems = computed(() => {
    return this.navItems.filter(item => {
      return (
        !item.permission || this.permissions().includes(item.permission)
      );
    });
  });

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
