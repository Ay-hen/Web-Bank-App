import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { TransactionComponent } from './transaction/transaction.component';

export const routes: Routes = [

    {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
    },

    {
        path: 'home',
        component : HomeComponent
    },

    {
        path : 'login',
        component : LoginComponent
    },

    {
        path : 'dashboard',
        component : DashboardComponent
    },

    {
        path : 'users',
        component : UserManagementComponent
    },

    {
        path : 'feedback',
        component : FeedbackComponent
    },

    {
        path: 'transaction',
        component: TransactionComponent
    }

];
