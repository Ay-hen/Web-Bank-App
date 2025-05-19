import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";
import { HttpClient } from '@angular/common/http';
import { ServicesService } from '../services/services.service';


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

    ngOnInit(){
      const username = this.service.getUsernameFromToken();
      this.http.get(`http://localhost:8181/api/v1/admins?currentUsername=${username}`).subscribe(
        (response: any) => {
          this.admins.set(response);
        },
        (error) => {
          console.error('Error fetching admins:', error);
        }
      )
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
          this.selectedMessage.set(null);
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

  fetchAdminById(adminId : number) {
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

  // In your component class

validateAdminId(value: string) {
    const numValue = Number(value);
    if (numValue > 0) {
        this.adminId=numValue;
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


}
