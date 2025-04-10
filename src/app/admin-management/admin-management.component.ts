import { Component, computed, signal } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";


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
export class AdminManagementComponent {

    username = signal('');
    searchQuery = signal('');
    selectedTab: string = 'tab1';
  
    sortBy = signal('newest');
    activeFeedback = signal<any>(null);
    showReportPopover = signal(false);
    
    currentPage = signal(0);
    currantPageIndex = signal(0); 
    itemsPerPage = 4;  
  

    admins = signal([
      { 
        id: 1, 
        name: "Adam Johnson", 
        email: "adam.johnson@company.com", 
        creationDate: "2023-10-01", 
        activities: [
          {id: 1, activity: "Login", date: "2023-10-02 09:15"},
          {id: 2, activity: "Change Password", date: "2023-10-03 14:30"},
          {id: 3, activity: "Updated Profile", date: "2023-10-04 11:20"},
          {id: 4, activity: "Deleted User", date: "2023-10-05 16:45"},
        ]
      },
      { 
        id: 2, 
        name: "Sarah Williams", 
        email: "sarah.w@business.org",  
        creationDate: "2023-09-15", 
        activities: [
          {id: 1, activity: "Login", date: "2023-09-16 08:30"},
          {id: 2, activity: "Role Changed", date: "2023-09-20 10:15"}
        ]
      },
      {
        id: 3,
        name: "Michael Chen",
        email: "michael.chen@tech.io",
        creationDate: "2023-11-05",
        activities: [
          {id: 1, activity: "Login", date: "2023-11-06 09:00"},
          {id: 2, activity: "Created Report", date: "2023-11-07 13:20"},
          {id: 3, activity: "Exported Data", date: "2023-11-08 15:10"}
        ]
      },
      {
        id: 4,
        name: "Emily Rodriguez",
        email: "emily.rdz@example.com",
        creationDate: "2023-08-22",
        activities: [
          {id: 1, activity: "Login", date: "2023-08-23 10:45"},
          {id: 2, activity: "Password Reset", date: "2023-08-25 11:30"},
          {id: 3, activity: "System Settings", date: "2023-08-28 14:15"}
        ]
      },
      {
        id: 5,
        name: "David Kim",
        email: "d.kim@enterprise.net",
        creationDate: "2023-12-10",
        activities: [
          {id: 1, activity: "Initial Setup", date: "2023-12-11 08:00"},
          {id: 2, activity: "Login", date: "2023-12-11 08:05"}
        ]
      },
      {
        id: 6,
        name: "Jessica Patel",
        email: "j.patel@admin.co",
        creationDate: "2023-07-18",
        activities: [
          {id: 1, activity: "Login", date: "2023-07-19 09:30"},
          {id: 2, activity: "User Management", date: "2023-07-20 10:45"},
          {id: 3, activity: "Audit Logs", date: "2023-07-21 11:20"},
          {id: 4, activity: "System Update", date: "2023-07-22 16:00"}
        ]
      },
      {
        id: 7,
        name: "Robert Smith",
        email: "robert.s@corp.com",
        creationDate: "2023-09-30",
        activities: [
          {id: 1, activity: "Login", date: "2023-10-01 08:15"},
          {id: 2, activity: "Dashboard Config", date: "2023-10-02 10:30"}
        ]
      },
      {
        id: 8,
        name: "Olivia Martin",
        email: "olivia.m@admin.org",
        creationDate: "2023-11-20",
        activities: [
          {id: 1, activity: "Login", date: "2023-11-21 09:10"},
          {id: 2, activity: "Notification Setup", date: "2023-11-22 11:25"},
          {id: 3, activity: "API Access", date: "2023-11-23 14:40"}
        ]
      },
      {
        id: 9,
        name: "Daniel Wilson",
        email: "daniel.w@sysadmin.net",
        creationDate: "2023-10-15",
        activities: [
          {id: 1, activity: "Login", date: "2023-10-16 08:45"},
          {id: 2, activity: "Security Audit", date: "2023-10-17 13:15"},
          {id: 3, activity: "Backup Config", date: "2023-10-18 15:30"}
        ]
      },
      {
        id: 10,
        name: "Sophia Lee",
        email: "sophia.lee@admin.io",
        creationDate: "2023-12-01",
        activities: [
          {id: 1, activity: "Login", date: "2023-12-02 10:00"},
          {id: 2, activity: "New User Created", date: "2023-12-03 11:20"},
          {id: 3, activity: "Permissions Updated", date: "2023-12-04 14:35"}
        ]
      }
    ]);

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
    if (!this.adminName()) return;

    if (this.newPassword !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Logic to update password via backend here
    alert(`Password for ${this.adminName()} has been reset.`);
    
    // Clear form
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
