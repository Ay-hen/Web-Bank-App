import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { TransactionComponent } from './transaction/transaction.component';
import { NotificationComponent } from './notification/notification.component';
import { AdminManagementComponent } from './admin-management/admin-management.component';
import { authGuard } from './guard/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: HomeComponent
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        data: { role: 'ADMIN', permission: 'VIEW_DASHBOARD' }
    },
    {
        path: 'users',
        component: UserManagementComponent,
        canActivate: [authGuard],
        data: { role: 'ADMIN', permission: 'MANAGE_USERS' }
    },
    {
        path: 'feedback',
        component: FeedbackComponent,
        canActivate: [authGuard],
        data: { role: 'ADMIN', permission: 'MANAGE_FEEDBACK' }
    },
    {
        path: 'transaction',
        component: TransactionComponent,
        canActivate: [authGuard],
        data: { role: 'ADMIN', permission: 'MANAGE_TRANSACTION' }
    },
    {
        path: 'notification',
        component: NotificationComponent,
        canActivate: [authGuard],
        data: { role: 'ADMIN', permission: 'MANAGE_NOTIFICATION' }
    },
    {
        path: 'admin-management',
        component: AdminManagementComponent,
        canActivate: [authGuard],
        data: { role: 'ADMIN', permission: 'MANAGE_ADMIN' }
    },
    {
        path: '**',
        redirectTo: '/home' // fallback for unknown routes
    }
];
