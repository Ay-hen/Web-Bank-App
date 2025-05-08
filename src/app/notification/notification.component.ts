import { Component, signal } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [DashboardNavbarComponent],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent {
  selectedType = signal<'all' | 'group'>('all');
  schedule = signal<'now' | 'custom'>('now');

  notificationType = '';
  message = '';
  groupId = '';
  customDate: string | null = null;

  onTypeChange(value: string) {
    this.selectedType.set(value as 'all' | 'group');
  }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
  onScheduleChange(value: string) {
    this.schedule.set(value as 'now' | 'custom');
  }

  sendNotification() {
    const payload: any = {
      type: this.notificationType,
      message: this.message,
      sendDate: this.schedule() === 'now' ? new Date().toISOString() : this.customDate,
    };

    if (this.selectedType() === 'group') {
      payload.groupId = this.groupId;
    }

    console.log('Sending Notification:', payload);
    // You can connect this to a backend API using HttpClient
  }
}
