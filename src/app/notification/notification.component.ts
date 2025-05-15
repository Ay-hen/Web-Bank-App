import { Component, inject, OnDestroy, signal } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";
import { HttpClient } from '@angular/common/http';
import { finalize, Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [DashboardNavbarComponent],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent implements OnDestroy {
  private http = inject(HttpClient);
  private scheduledNotifications: Subscription[] = [];
  
  selectedType = signal<'all' | 'group'>('all');
  schedule = signal<'now' | 'custom'>('now');
  isSending = signal<boolean>(false);
  
  notificationType = '';
  title = ''; // Added title field
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
    if (!this.validateNotification()) {
      return;
    }
    
    const payload = this.createNotificationPayload();
    
    if (this.schedule() === 'now') {
      this.submitNotification(payload);
    } else {
      this.scheduleNotification(payload);
    }
  }
  
  private validateNotification(): boolean {
    // Basic validation
    if (!this.notificationType) {
      alert('Please select a notification type');
      return false;
    }
    
    if (!this.title) {
      alert('Please enter a notification title');
      return false;
    }
    
    if (!this.message) {
      alert('Please enter a notification message');
      return false;
    }
    
    if (this.selectedType() === 'group' && !this.groupId) {
      alert('Please select a group');
      return false;
    }
    
    if (this.schedule() === 'custom' && !this.customDate) {
      alert('Please select a date and time for the scheduled notification');
      return false;
    }
    
    return true;
  }
  
  private createNotificationPayload(): any {
    const payload: any = {
      type: this.notificationType,
      title: this.title,
      message: this.message,
      senderModule: 'DASHBOARD',
      sendDate: this.schedule() === 'now' ? new Date().toISOString() : this.customDate,
    };
    
    if (this.selectedType() === 'group') {
      payload.groupId = this.groupId;
    }
    
    return payload;
  }
  
  private submitNotification(payload: any) {
    this.isSending.set(true);
    
    this.http.post('http://localhost:8181/api/v1/notifications/send', payload, { responseType: 'text' })
    .pipe(finalize(() => this.isSending.set(false)))
    .subscribe({
      next: (response) => {
        console.log('Notification sent successfully:', response);
        this.resetForm();
      },
      error: (error) => {
        console.error('Error sending notification:', error);
        alert('Failed to send notification. Please try again.');
      }
    });

  }
  
  private scheduleNotification(payload: any) {
    if (!this.customDate) return;
    
    const targetDate = new Date(this.customDate);
    const currentDate = new Date();
    const timeUntilSend = targetDate.getTime() - currentDate.getTime();
    
    if (timeUntilSend <= 0) {
      alert('Cannot schedule notification in the past');
      return;
    }
    
    console.log(`Notification scheduled for ${targetDate.toLocaleString()}`);
    alert(`Notification scheduled for ${targetDate.toLocaleString()}`);
    
    // Store the scheduled notification in database for persistence across sessions
    this.http.post('http://localhost:8181/api/v1/api/notifications/send-all', payload).subscribe({
      next: (response) => {
        console.log('Notification scheduled in database:', response);
        this.resetForm();
      },
      error: (error) => {
        console.error('Error scheduling notification:', error);
        alert('Failed to schedule notification. Please try again.');
      }
    });
    
    // For demo purposes, we'll also keep a client-side timer 
    // (this would be handled server-side in production)
    const subscription = timer(timeUntilSend).subscribe(() => {
      this.submitNotification(payload);
    });
    
    this.scheduledNotifications.push(subscription);
  }
  
  private resetForm() {
    this.notificationType = '';
    this.title = '';
    this.message = '';
    this.groupId = '';
    this.customDate = null;
    this.selectedType.set('all');
    this.schedule.set('now');
  }
  
  ngOnDestroy() {
    // Clean up any pending timers when component is destroyed
    this.scheduledNotifications.forEach(sub => sub.unsubscribe());
  }
}
