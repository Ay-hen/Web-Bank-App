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
export class UserManagementComponent {

  

  maxPage() {
    return Math.floor(this.filteredCustomers().length / this.itemsPerPage);
  }

  selectedTab : string = 'tab1'; // Default tab

  searchQuery = signal('');
  sortBy = signal('newest');
  activeCustomer = signal<any>(null);
  showReportPopover = signal(false);

  currentPage = signal(0);
  currantPageIndex = signal(0); // Current page index for pagination
  itemsPerPage = 4;  // Max rows per page

  // Dummy customer data
  customers = signal([
    { id: 1, name: 'John Doe', amount: '$1000', phone: '123-456-7890', email: 'john@example.com', status: 'Active', creationDate: '2024-01-15' },
    { id: 2, name: 'Conan Kun', amount: '$1000', phone: '0632887456', email: 'conan@example.com', status: 'Active', creationDate: '2024-01-15' },
    { id: 3, name: 'Ayoub Hen', amount: '$1500', phone: '0636859674', email: 'ayoub@example.com', status: 'Active', creationDate: '2024-01-15' },
    { id: 4, name: 'Zara Lune', amount: '$1200', phone: '0637774444', email: 'zara@example.com', status: 'Inactive', creationDate: '2024-02-18' },
    { id: 5, name: 'Lucas M', amount: '$800', phone: '0633339876', email: 'lucas@example.com', status: 'Active', creationDate: '2024-03-10' },
    { id: 6, name: 'Clara B', amount: '$2000', phone: '0634223456', email: 'clara@example.com', status: 'Active', creationDate: '2024-04-01' },
  ]);

  // Computed list based on search, sort, and pagination
  filteredCustomers = computed(() => {
    const startIndex = this.currentPage() * this.itemsPerPage;
    return this.customers().slice(startIndex, startIndex + this.itemsPerPage);
  });

  // Go to the next page
  goToNextPage() {
    const maxPage = Math.floor(this.customers().length / this.itemsPerPage);
    if (this.currentPage() < maxPage) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  // Go to the previous page
  goToPreviousPage() {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  /*filteredCustomers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const sorted = [...this.customers()].filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query)
    );

    return this.sortBy() === 'oldest'
      ? sorted.reverse()
      : sorted;
  });*/



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

  
  // Pagination logic
  paginatedCustomers() {
    const startIndex = this.currentPage() * this.itemsPerPage;
    return this.filteredCustomers().slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Popover controls
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
      this.activePopoverCustomer.set(null); // Close if it's already active
    } else {
      this.activePopoverCustomer.set(customer);
      this.activeDownloadCustomer.set(null); // Close any open downloads
    }
  }
  
}
