import { Component, computed, signal } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";


type Customer = {
  id: number;
  name: string;
  amount: string;
  phone: string;
  email: string;
  status: string;
  creationDate: string;
};


@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [DashboardNavbarComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent  {
  

  maxPage() {
    return Math.floor(this.filteredCustomers().length / this.itemsPerPage);
  }

  selectedTab : string = 'tab1'; // Default tab

  searchQuery = signal('');
  sortBy = signal('newest');
  activeCustomer = signal<any>(null);
  showReportPopover = signal(false);

  currentPage = signal(0);
  currantPageIndex = signal(0); 
  itemsPerPage = 4;  

  // Dummy customer data
  customers = signal([
    { id: 1, name: 'John Doe', amount: '$1000', phone: '123-456-7890', email: 'john@example.com', status: 'Active', creationDate: '2024-01-15' },
    { id: 2, name: 'Conan Kun', amount: '$1000', phone: '0632887456', email: 'conan@example.com', status: 'Active', creationDate: '2024-01-15' },
    { id: 3, name: 'Ayoub Hen', amount: '$1500', phone: '0636859674', email: 'ayoub@example.com', status: 'Active', creationDate: '2024-01-15' },
    { id: 4, name: 'Zara Lune', amount: '$1200', phone: '0637774444', email: 'zara@example.com', status: 'Inactive', creationDate: '2024-02-18' },
    { id: 5, name: 'Lucas M', amount: '$800', phone: '0633339876', email: 'lucas@example.com', status: 'Active', creationDate: '2024-03-10' },
    { id: 6, name: 'Clara B', amount: '$2000', phone: '0634223456', email: 'clara@example.com', status: 'Active', creationDate: '2024-04-01' },
  ]);

  filteredCustomers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const sort = this.sortBy();
    const page = this.currentPage();
    const perPage = this.itemsPerPage;
  
    // Start with full list
    let list = this.customers();
  
    // Filter
    if (query) {
      list = list.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.includes(query)
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
    const maxPage = Math.floor(this.customers().length / this.itemsPerPage);
    if (this.currentPage() < maxPage) {
      this.currentPage.set(this.currentPage() + 1);
    }
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

  downloadReport(customer: any, format: 'csv' | 'pdf') {
    console.log(`Downloading ${format.toUpperCase()} report for:`, customer);
    this.showReportPopover.set(false);
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
    return Math.ceil(this.customers.length / this.itemsPerPage);
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
  availablePermissions = [
    'User Management', 
    'Content Management', 
    'System Settings', 
    'Audit Logs', 
    'Financial Reports', 
    'Customer Data', 
    'Analytics', 
    'API Access',
    'Billing Management',
    'User Profile Editing',
    'Database Management',
    'Email Templates',
    'Security Controls',
    'Backup & Recovery',
    'Third-party Integrations'
  ];
  
  selectedPermissions = signal<string[]>([]);
  filteredPermissions = signal<string[]>(this.availablePermissions);
  
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
    
    this.permissionSearch.set(term.toLowerCase().trim());
  
    if (!this.permissionSearch()) {
      this.filteredPermissions.set([]);
      return;
    }

    if (!term) {
      // Show all permissions except those already selected
      this.filteredPermissions.set(
        this.availablePermissions.filter(p => 
          !this.selectedPermissions().includes(p)
        )
      );
      return;
    }
    
    // Filter by search term and exclude already selected permissions
    this.filteredPermissions.set(
      this.availablePermissions.filter(p => 
        p.toLowerCase().includes(term) && 
        !this.selectedPermissions().includes(p)
      )
    );
  }
  
  addPermission(permission: string): void {
    if (!this.selectedPermissions().includes(permission)) {
      // Create a new array with the added permission
      this.selectedPermissions.update(perms => [...perms, permission]);
      
      // Update filtered permissions to remove the selected one
      this.filteredPermissions.update(perms => 
        perms.filter(p => p !== permission)
      );
    }
  }
  
  removePermission(permission: string): void {
    // Remove from selected permissions
    this.selectedPermissions.update(perms =>
      perms.filter(p => p !== permission)
    );
    
    // Add back to filtered permissions if it matches current filter
    this.filteredPermissions.update(perms => [...perms, permission].sort());
  }

  createUser(): void {
    // Form validation
    if (!this.username() || !this.email() || !this.password() || !this.confirmPassword()) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (this.password() !== this.confirmPassword()) {
      alert('Passwords do not match');
      return;
    }
    
    // Create user object based on role
    const userData = {
      username: this.username(),
      email: this.email(),
      role: this.selectedRole(),
      permissions: this.selectedRole() === 'admin' ? this.selectedPermissions() : []
    };
    
    // In a real application, you would send this data to your API
    console.log('Creating user:', userData);
    alert(`${this.selectedRole()} created successfully!`);
    
    // Reset form
    this.username.set('');
    this.email.set('');
    this.password.set('');
    this.confirmPassword.set('');
    
    
    if (this.selectedRole() === 'admin') {
      this.selectedPermissions.set([]);
      this.filteredPermissions.set(this.availablePermissions);
    }
  }

  onInputChange(field: string, value: string) {
    if (field === 'username') {
      this.username.set(value);
    } else if (field === 'email') {
      this.email.set(value);
    } else if (field === 'password') {
      this.password.set(value);
    } else if (field === 'confirmPassword') {
      this.confirmPassword.set(value);
    }
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
      this.availablePermissions.filter(p => 
        p.toLowerCase().includes(searchTerm) && 
        !this.selectedPermissions().includes(p)
      )
    );
  }
  isSelected(perm: string): boolean {
    return this.selectedPermissions().includes(perm);
  }

}
