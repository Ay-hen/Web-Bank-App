import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";
import { HttpClient } from '@angular/common/http';
import { ServicesService } from '../services/services.service';
import { identity } from 'rxjs';


type Admin={
  id: number;
  name: string;
  email: string;
  creationDate: string;
  activities: any;
}


@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [DashboardNavbarComponent],
  templateUrl: './admin-management.component.html',
  styleUrl: './admin-management.component.scss'
})
export class AdminManagementComponent implements OnInit {

    username = signal('');
    searchQuery = signal('');
    selectedTab: string = 'tab1';
  
    sortBy = signal('newest');
    activeFeedback = signal<any>(null);
    showReportPopover = signal(false);
    
    currentPage = signal(0);
    currantPageIndex = signal(0); 
    itemsPerPage = 4;  
  
    //api : http://localhost:8181/api/v1/admis

    http = inject(HttpClient);
    service = inject(ServicesService);
    permAdminId: any;
    showAccessPopup: any;

    // Permissions management
    permissionSearch = signal('');
    availablePermissions = signal<{ code: string; name: string }[]>([]);
    filteredPermissions = signal<{ code: string; name: string }[]>([]);
    selectedPermissions = signal<string[]>([]);
    allPermissions = signal<{ code: string; name: string }[]>([]);

    ngOnInit(){
      const username = this.service.getUsernameFromToken();
      this.http.get(`http://localhost:8181/api/v1/admins?currentUsername=${username}`).subscribe({
        next : (response: any) => {
          this.admins.set(response);
        },
        error : (error) => {
          console.error('Error fetching admins:', error);
        }}
      );

      this.fetchPermissions();
    }

    fetchPermissions(){
      this.http.get<{ code: string; name: string }[]>('http://localhost:8181/api/v1/permissions').subscribe({
        next: (permissions) => {
          this.availablePermissions.set(permissions);
          this.allPermissions.set([...permissions]); 
          this.updateFilteredPermissions();
          console.log('Permissions:', permissions);
        },
        error: (err) => {
          console.error('Failed to load permissions:', err);
        }
      });
    }

    updateFilteredPermissions(): void {
      const searchTerm = this.permissionSearch().toLowerCase().trim();
      const selectedCodes = this.selectedPermissions();
      
      this.filteredPermissions.set(
        this.allPermissions().filter(p => 
          p.name.toLowerCase().includes(searchTerm) &&
          !selectedCodes.includes(p.name)
        )
      );
    }

    admins = signal<any[]>([]);

    filteredAdmins = computed(() => {
      const query = this.searchQuery().toLowerCase();
      const sort = this.sortBy();
      const page = this.currentPage();
      const perPage = this.itemsPerPage;
    
      // Start with full list
      let list = this.admins();
    
      // Filter
      if (query) {
        list = list.filter(admin =>
          admin.name.toLowerCase().includes(query) ||
          admin.email.toLowerCase().includes(query) 
        );
      }
    
      // Sort
      if (sort === 'newest') {
        list = [...list].sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
      } else if (sort === 'oldest') {
        list = [...list].sort((a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime());
      }
    
      // Paginate
      const startIndex = page * perPage;
      return list.slice(startIndex, startIndex + perPage);
    });
  
    goToNextPage() {
      const maxPage = Math.floor(this.admins().length / this.itemsPerPage);
      if (this.currentPage() < maxPage) {
        this.currentPage.set(this.currentPage() + 1);
      }
    }
  
    goToPreviousPage() {
      if (this.currentPage() > 0) {
        this.currentPage.set(this.currentPage() - 1);
      }
    }

    totalPages(): number {
      return Math.ceil(this.admins().length / this.itemsPerPage);
    }
    
    hasPreviousPage(): boolean {
      return this.currentPage() > 0;
    }
    
    hasNextPage(): boolean {
      return this.currentPage() < this.totalPages() - 1;
    }
  
    filteredadminsSearch = computed(() => {
      const query = this.searchQuery().toLowerCase();
      const sorted = [...this.admins()].filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
      );
  
      return this.sortBy() === 'oldest'
        ? sorted.reverse()
        : sorted;
    });

    selectedMessage = signal<Admin | null>(null);
    
    openMessagePopup(admin: Admin) {
      this.selectedMessage.set(admin);
    }

    closePopup() {
      this.isClosing = true;
      setTimeout(() => {
        this.selectedMessage.set(null);
        this.isClosing = false;
      }, 300); 
    }

    isClosing = false;

    currentActivitiesPage = signal(0);
    activitiesPerPage = 3;

    paginatedActivities = computed(() => {
      const start = this.currentActivitiesPage() * this.activitiesPerPage;
      return this.selectedMessage()?.activities.slice(start, start + this.activitiesPerPage) || [];
    });

    totalActivitiesPages = computed(() => {
      return Math.ceil((this.selectedMessage()?.activities.length || 0) / this.activitiesPerPage);
    });

    nextActivitiesPage() {
      if (this.currentActivitiesPage() < this.totalActivitiesPages() - 1) {
        this.currentActivitiesPage.update(p => p + 1);
      }
    }

    prevActivitiesPage() {
      if (this.currentActivitiesPage() > 0) {
        this.currentActivitiesPage.update(p => p - 1);
      }
    }

    /* ******************************************************** Tab2 ******************************************************** */

    adminId: number | null = null;
    newPassword = '';
    confirmPassword = '';
    adminName = signal('');
    errorMessage = signal('');

    fetchAdminById(adminId: number) {
      const username = this.service.getUsernameFromToken();
      this.http.get(`http://localhost:8181/api/v1/admin/${adminId}/name?username=${username}`).subscribe();
      const id = Number(adminId);
      const found = this.admins().find(admin => admin.id === id);
      console.log('Found admin:', found);
      if (found) {
        this.adminName.set(found.name);
        this.errorMessage.set('');
      } else {
        this.adminName.set('');
        this.errorMessage.set('Admin with this ID does not exist.');
      }
    }

    resetPassword() {
      this.http.post(`http://localhost:8181/api/v1/admin/${this.adminId}/reset-password`, {
        newPassword: this.newPassword
      }).subscribe(
        response => {
          console.log('Password reset successful:', response);
        },
      
        error => {
          console.error('Error resetting password:', error);
          this.errorMessage.set('Failed to reset password. Please try again.');
        }
      );

      this.adminId = null;
      this.newPassword = '';
      this.confirmPassword = '';
      this.adminName.set('');
      this.errorMessage.set('');
    }

    validateAdminId(value: string) {
      const numValue = Number(value);
      if (numValue > 0) {
          this.adminId = numValue;
      } else {
          this.adminId = 0;
      }
    }

    // Popup logic
    showConfirmPopup = signal(false);

    confirmReset() {
      this.resetPassword();
      this.showConfirmPopup.set(false);
    }

    adminAccessId = '';
    adminAccessName = signal('');
    showDropdown = signal(false);

    // Filter permissions based on search term
    filterPermissionsSearch(searchTerm: string): void {
      this.permissionSearch.set(searchTerm);
      this.updateFilteredPermissions();
    }
    
    // Add permission to selected list
    addPermission(code: string): void {
      if (!this.selectedPermissions().includes(code)) {
        this.selectedPermissions.update(perms => [...perms, code]);
        // Update filtered permissions to remove the newly selected permission
        this.updateFilteredPermissions();
      }
    }
    
    // Remove permission from selected list
    removePermission(code: string): void {
      this.selectedPermissions.update(perms =>
        perms.filter(p => p !== code)
      );
      // Update filtered permissions to add back the removed permission
      this.updateFilteredPermissions();
    }

    toggleDropdown() {
      this.showDropdown.set(!this.showDropdown());
    }

    validateAccessId(id: string) {
      this.adminAccessId = id;
    }

    // Fetch admin and their permissions
    fetchAccessAdminById(id: string) {
      this.http.get(`http://localhost:8181/api/v1/admin/${id}`).subscribe(
        (response: any) => {
          console.log('Fetched admin:', response);
          this.adminAccessName.set(response.name);

          // Set the selected permissions from the fetched admin
          if (response.permissions && Array.isArray(response.permissions)) {
            this.selectedPermissions.set(response.permissions);
            // Update filtered permissions with current search term
            this.updateFilteredPermissions();
          }
        },
        (error) => {
          console.error('Error fetching admin:', error);
          this.adminAccessName.set('');
          this.selectedPermissions.set([]);
        }
      );
    }

    // Check if a permission is currently selected
    isSelected(code: string): boolean {
      return this.selectedPermissions().includes(code);
    }

    // Toggle selection status of a permission
    togglePermission(code: string) {
      const current = this.selectedPermissions();
      if (current.includes(code)) {
        this.selectedPermissions.set(current.filter(p => p !== code));
      } else {
        this.selectedPermissions.set([...current, code]);
      }
      // Update filtered permissions after toggling
      this.updateFilteredPermissions();
    }

    // Save permissions changes to backend
    savePermissions() {
      if (!this.adminAccessId) {
        console.error('No admin ID provided');
        return;
      }
      
      this.http.post(`http://localhost:8181/api/v1/admin/${this.adminAccessId}/permissions`, {
        permissions: this.selectedPermissions()
      }).subscribe(
        (response) => {
          console.log('Permissions updated successfully:', response);
          // You might want to add success feedback here
        },
        (error) => {
          console.error('Failed to update permissions:', error);
          // You might want to add error feedback here
        }
      );
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
      const target = event.target as HTMLElement;

      if (!target.closest('.dropdown-header')) {
        this.showDropdown.set(false);
      }
      if (!target.closest('.report-popover')) {
        this.showReportPopover.set(false);
      }
    }

  notification = signal<{ message: string, type: 'success' | 'error' } | null>(null);
  
  private showNotification(message: string, type: 'success' | 'error') {
    this.notification.set(null);
    
    setTimeout(() => {
      this.notification.set({ message, type });
      this.resetForm();
      setTimeout(() => {
        const notificationElement = document.querySelector('.notification-popup');
        if (notificationElement) {
          notificationElement.classList.add('hiding');
  
          setTimeout(() => {
            this.notification.set(null);
          }, 300); 
        } else {
          this.notification.set(null);
        }
      }, 4000);
    }, 100);
  }

  resetForm() {
    this.adminAccessId = '';
    this.adminAccessName.set('');
    this.selectedPermissions.set([]);
    this.permissionSearch.set('');
    this.fetchPermissions();
  }

  saveChanges(){
    const request = {
      id : this.adminAccessId,
      permissions : this.selectedPermissions()
    }

    const url = `http://localhost:8181/api/v1/admin/reset-permissions`;
    this.http.post(url, request).subscribe({
      next: (response) => {
        this.showNotification('Permissions updated successfully', 'success');
        this.resetForm();
      },
      error: (error) => {
        this.showNotification("Failed to update permissions", 'error');
      }
    });
  }


  confirmResetAccess(){

  }
}