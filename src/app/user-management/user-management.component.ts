import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";
import { ServicesService } from '../services/services.service';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';


type Customer = {
  id: number;
  name: string;
  amount: string;
  phone: string;
  email: string;
  status: string;
  creationDate: string;
  activities : any;
  rib : string;
};


@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [DashboardNavbarComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  

  maxPage() {
    return Math.floor(this.filteredCustomers().length / this.itemsPerPage);
  }

  constructor(private http : HttpClient) { }

  selectedTab : string = 'tab1'; // Default tab

  searchQuery = signal('');
  sortBy = signal('newest');
  activeCustomer = signal<any>(null);
  showReportPopover = signal(false);

  currentPage = signal(0);
  currantPageIndex = signal(0); 
  itemsPerPage = 4;  

  private service = inject(ServicesService);

  ngOnInit(): void {
    this.service.getCustomers().subscribe(data => {
      this.customers.set(data);
      //console.log('Customers:', this.customers());
      this.loading.set(false);
    });

    this.http.get<{ code: string; name: string }[]>('http://localhost:8181/api/v1/permissions').subscribe({
      next: (permissions) => {
        this.availablePermissions.set(permissions);
        this.filteredPermissions.set(permissions);
        console.log('Permissions:', permissions);
      },
      error: (err) => {
        console.error('Failed to load permissions:', err);
      }
    });
  }

  customers = signal<any[]>([]);
  loading = signal(true);
  

  filteredCustomers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const sort = this.sortBy();
    const page = this.currentPage();
    const perPage = this.itemsPerPage;
  
    // Start with full list
    let list = [...this.customers()];
  
    // Filter if query exists
    if (query) {
      list = list.filter(customer => {
        const nameMatch = customer.name?.toLowerCase().includes(query) ?? false;
        const emailMatch = customer.email?.toLowerCase().includes(query) ?? false;
        const phoneMatch = customer.phoneNumber?.toString().toLowerCase().includes(query) ?? false;
        
        return nameMatch || emailMatch || phoneMatch;
      });
    }
  
    // Sort
    if (sort === 'newest') {
      list.sort((a, b) => {
        const dateA = new Date(a.creationDate || a.createdDate || 0);
        const dateB = new Date(b.creationDate || b.createdDate || 0);
        return dateB.getTime() - dateA.getTime();
      });
    } else if (sort === 'oldest') {
      list.sort((a, b) => {
        const dateA = new Date(a.creationDate || a.createdDate || 0);
        const dateB = new Date(b.creationDate || b.createdDate || 0);
        return dateA.getTime() - dateB.getTime();
      });
    } else if (sort === 'amount') {
      list.sort((a, b) => (a.amount || 0) - (b.amount || 0));
    }
  
    // Paginate
    const startIndex = page * perPage;
    return list.slice(startIndex, startIndex + perPage);
  });
  

  goToNextPage() {
    const maxPage = Math.floor(this.customers().length / this.itemsPerPage);
    if (this.currentPage() < maxPage) {
      this.currentPage.set(this.currentPage() + 1);
    }
    console.log('Current Page:', this.customers());
  }

  goToPreviousPage() {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  filteredCustomersSearch = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const sorted = [...this.customers()].filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query)
    );

    return this.sortBy() === 'oldest'
      ? sorted.reverse()
      : sorted;
  });



  toggleReportPopover(customer: any) {
    const isSame = this.activeCustomer() === customer;
    this.showReportPopover.set(!this.showReportPopover() && isSame);
  }

  viewProfile(customer: any) {
    console.log('View profile:', customer);
  }

  blockCustomer(customer: any) {
    console.log('Blocked:', customer);
  }

  // Add these properties
isDownloading = signal<{csv: boolean, pdf: boolean}>({csv: false, pdf: false});
downloadProgress = signal<{csv: number, pdf: number}>({csv: 0, pdf: 0});

// Enhanced download method
downloadReport(customer: Customer, format: 'csv' | 'pdf') {
  // Set loading state
  this.isDownloading.update(state => ({...state, [format]: true}));
  this.downloadProgress.update(state => ({...state, [format]: 0}));

  const customerId = customer.id;
  const url = `http://localhost:8181/api/v1/report/${format}?id=${customerId}`;

  this.service.downloadFileWithProgress(url).subscribe({
    next: (event: any) => {
      if (event.type === HttpEventType.DownloadProgress) {
        // Update progress
        const progress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
        this.downloadProgress.update(state => ({...state, [format]: progress}));
      } else if (event instanceof HttpResponse) {
        // Download complete
        const blob = event.body;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${customer.name.replace(/\s+/g, '_')}_report.${format}`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Reset states
        this.isDownloading.update(state => ({...state, [format]: false}));
        this.downloadProgress.update(state => ({...state, [format]: 0}));
      }
    },
    error: (error:any) => {
      console.error(`Error downloading ${format} report:`, error);
      this.isDownloading.update(state => ({...state, [format]: false}));
      this.downloadProgress.update(state => ({...state, [format]: 0}));
    }
  });
}


  paginatedCustomers() {
    const startIndex = this.currentPage() * this.itemsPerPage;
    return this.filteredCustomers().slice(startIndex, startIndex + this.itemsPerPage);
  }

  activePopoverCustomer = signal<Customer | null>(null);
  activeDownloadCustomer = signal<Customer | null>(null);

  toggleDownloadOptions(customer: Customer) {
    if (this.activeDownloadCustomer() === customer) {
      this.activeDownloadCustomer.set(null);
    } else {
      this.activeDownloadCustomer.set(customer);
      this.activePopoverCustomer.set(null);
    }
  }
  
  toggleMore(customer: Customer) {
    if (this.activePopoverCustomer() === customer) {
      this.activePopoverCustomer.set(null); 
    } else {
      this.activePopoverCustomer.set(customer);
      this.activeDownloadCustomer.set(null); 
    }
  }


  totalPages(): number {
    return Math.ceil(this.customers().length / this.itemsPerPage);
  }
  
  
  hasPreviousPage(): boolean {
    return this.currentPage() > 0;
  }
  
  hasNextPage(): boolean {
    return this.currentPage() < this.totalPages() - 1;
  }
  


  /* Tab 2 */

  selectedRole = signal<string>('user');
  username = signal<string>('');
  email = signal<string>('');
  password = signal<string>('');
  confirmPassword = signal<string>('');
  permissionSearch = signal('');
  
  // Permissions
  availablePermissions = signal<{ code: string; name: string }[]>([]);
  filteredPermissions = signal<{ code: string; name: string }[]>([]);

  
  selectedPermissions = signal<string[]>([]);
  
  selectRole(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedRole.set(select.value);
    
    // Reset form when role changes
    this.username.set('');
    this.email.set('');
    this.password.set('');
    this.confirmPassword.set('');
    
    if (select.value !== 'admin') {
      this.selectedPermissions.set([]);
    }
    console.log('Selected role:', this.selectedRole());
  }
  
  filterPermissionsSearch(searchTerm: string): void {
    const term = searchTerm.toLowerCase().trim();
    this.permissionSearch.set(term);
  
    const selected = this.selectedPermissions();
  
    this.filteredPermissions.set(
      this.availablePermissions().filter(p =>
        p.name.toLowerCase().includes(term) && !selected.includes(p.code)
      )
    );
  }
  
  
  addPermission(name: string): void {
    if (!this.selectedPermissions().includes(name)) {
      this.selectedPermissions.update(perms => [...perms, name]);
  
      this.filteredPermissions.update(perms => 
        perms.filter(p => p.name !== name)
      );
    }
  }
  
  
  removePermission(code: string): void {
    this.selectedPermissions.update(perms =>
      perms.filter(p => p !== code)
    );
  
    const permission = this.availablePermissions().find(p => p.code === code);
    if (permission) {
      this.filteredPermissions.update(perms => [...perms, permission]);
    }
  }
  

  formData: any = {
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  
  onInputChange(field: string, value: string) {
    this.formData[field] = value;
  }

  
  createUser() {
    const requestBody = {
      name: this.formData.name || '',
      username: this.formData.username,
      email: this.formData.email,
      password: this.formData.password,
      role: this.selectedRole(),
      creationDate: new Date().toISOString(),
      permissions: this.selectedRole() === 'admin' ? this.selectedPermissions() : []
    };
  
    console.log('Sending request:', requestBody);
  
    this.http.post('http://localhost:8181/user/auth/create-user', requestBody, {
      responseType: 'text' // This tells Angular to expect text, not JSON
    }).subscribe({
      next: (response) => {
        console.log('Success response:', response);
        this.showNotification('User created successfully', 'success');
        this.resetForm();
      },
      error: (err) => {
        console.error('Error response:', err);
        const errorMessage = err.error?.message || err.error || 'Error creating user';
        this.showNotification(errorMessage, 'error');
      }
    });
  }
  


  resetForm() {
    this.formData = {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    
  }
  

  showDropdown = signal<boolean>(false);

  toggleDropdown(): void {
    this.showDropdown.update(value => !value);
    
    // If opening, reset the filtered permissions
    if (!this.showDropdown()) {
      this.permissionSearch.set('');
      this.updateFilteredPermissions('');
    }
  }

  private updateFilteredPermissions(term: string): void {
    const searchTerm = term.toLowerCase().trim();
  
    this.filteredPermissions.set(
      this.availablePermissions().filter(p =>
        p.name.toLowerCase().includes(searchTerm) &&
        !this.selectedPermissions().includes(p.code)
      )
    );
  }
  
  isSelected(code: string): boolean {
    return this.selectedPermissions().includes(code);
  }
  

  @HostListener('document:click', ['$event'])
      onDocumentClick(event: MouseEvent): void {
          const target = event.target as HTMLElement;
          if (!target.closest('.more-wrapper')) {
              this.activePopoverCustomer.set(null);
          }
          if (!target.closest('.dropdown-header')) {
              this.showDropdown.set(false);
          }
          if (!target.closest('.report-popover')) {
              this.showReportPopover.set(false);
          }
          if (!target.closest('.download')) {
              this.activeDownloadCustomer.set(null);
          }
      }


  selectedMessage = signal<Customer | null>(null);
      
  openMessagePopup(customer: Customer) {
    if (this.activePopoverCustomer() === customer) {
      this.activePopoverCustomer.set(null); 
    }
    this.selectedMessage.set(customer);
    
    // Reset activities pagination when opening a new popup
    this.currentActivitiesPage.set(0);
    
    // Fetch activities for this customer
    this.fetchActivities(customer.id);
  }
  
  activities = signal<any[]>([]);
  
  fetchActivities(userId: number) {
    this.loading.set(true);
    this.http.get<any[]>(`http://localhost:8181/api/v1/activities/${userId}`).subscribe({
      next: (data) => {
        this.activities.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load activities:', err);
        this.activities.set([]);
        this.loading.set(false);
      }
    });
  }
  
  // Update the paginatedActivities computed property
  paginatedActivities = computed(() => {
    const start = this.currentActivitiesPage() * this.activitiesPerPage;
    return this.activities().slice(start, start + this.activitiesPerPage);
  });
  
  // Update the totalActivitiesPages computed property
  totalActivitiesPages = computed(() => {
    return Math.ceil(this.activities().length / this.activitiesPerPage);
  });
  
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
  /*
  paginatedActivities = computed(() => {
    const start = this.currentActivitiesPage() * this.activitiesPerPage;
    return this.selectedMessage()?.activities.slice(start, start + this.activitiesPerPage) || [];
  });
  
  totalActivitiesPages = computed(() => {
    return Math.ceil((this.selectedMessage()?.activities.length || 0) / this.activitiesPerPage);
  });
  */
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
  
  notification = signal<{ message: string, type: 'success' | 'error' } | null>(null);

  private showNotification(message: string, type: 'success' | 'error') {
    // Clear any existing notifications first
    this.notification.set(null);
    
    // Set new notification after a short delay to ensure animations work correctly
    setTimeout(() => {
      this.notification.set({ message, type });
      this.resetForm();
      // Clear after 4 seconds with exit animation
      setTimeout(() => {
        const notificationElement = document.querySelector('.notification-popup');
        if (notificationElement) {
          notificationElement.classList.add('hiding');
          
          // Wait for animation to complete before removing
          setTimeout(() => {
            this.notification.set(null);
          }, 300); // Match the animation duration
        } else {
          this.notification.set(null);
        }
      }, 4000);
    }, 100);
  }

  formatActivityDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Format as YYYY-MM-DD HH:MM (24-hour format)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${hours}:${minutes}    ${year}-${month}-${day} `;
    } catch (e) {
      console.error('Error formatting date', e);
      return dateString; // Return original if formatting fails
    }
  }
}
