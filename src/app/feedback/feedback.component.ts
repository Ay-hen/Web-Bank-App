import { Component, computed, HostListener, signal } from '@angular/core';
import { DashboardNavbarComponent } from "../dashboard-navbar/dashboard-navbar.component";
import jsPDF from 'jspdf';



type Feedback = {
  id: number;
  name: string;
  category: string;
  creationDate: string;
  message: string;
  status: string;
}


@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [DashboardNavbarComponent],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.scss'
})
export class FeedbackComponent {

  username = signal('');

  testUserWithFeedbacks = {
    name: "John Doe",
    email: "john.doe@example.com",
    feedbacks: [
      {
        id: 1,
        name: "Sarah Johnson",
        category: "Product Quality",
        creationDate: "2023-10-15",
        message: "The product arrived damaged. The packaging was torn and contents were partially missing.",
        status: "Pending"
      },
      {
        id: 2,
        name: "Michael Chen",
        category: "Customer Service",
        creationDate: "2023-10-14",
        message: "Excellent support! The representative went above and beyond to resolve my issue quickly.",
        status: "Resolved"
      },
      {
        id: 3,
        name: "Emma Williams",
        category: "Shipping",
        creationDate: "2023-10-12",
        message: "Delivery was late by 3 days. The tracking information wasn't updated properly.",
        status: "Pending"
      },
      {
        id: 4,
        name: "David Kim",
        category: "Product Feature",
        creationDate: "2023-10-10",
        message: "Would love to see dark mode added to the mobile app. Current bright theme strains my eyes at night.",
        status: "Under Review"
      },
      {
        id: 5,
        name: "Lisa Rodriguez",
        category: "Billing",
        creationDate: "2023-10-08",
        message: "I was charged twice for my subscription this month. Need help getting a refund for the duplicate charge.",
        status: "Pending"
      }
    ]
  };



  private convertToCSV(data: Feedback[]): string {
    const headers = ['ID', 'Name', 'Category', 'Date', 'Message', 'Status'];
    const rows = data.map(f =>
      [f.id, f.name, f.category, f.creationDate, `"${f.message.replace(/"/g, '""')}"`, f.status].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
  
  private convertToText(data: Feedback[]): string {
    return data.map(f =>
      `ID: ${f.id}
  Name: ${f.name}
  Category: ${f.category}
  Date: ${f.creationDate}
  Message: ${f.message}
  Status: ${f.status}
  
  ----------------------------
  `).join('\n');
  }
  

  downloadFeedbacks(type: 'csv' | 'pdf', username: string) {
    const data = this.feedbacks().filter(f =>
      f.name.toLowerCase() === username.toLowerCase()
    );
  
    if (data.length === 0) {
      alert('No feedbacks found for this user');
      return;
    }
  
    if (type === 'csv') {
      const csv = this.convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${username}_feedbacks.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (type === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(12);
      doc.text(`Feedbacks for ${username}`, 10, 10);
  
      let y = 20;
      data.forEach((f, index) => {
        doc.text(`${index + 1}. Category: ${f.category}`, 10, y);
        y += 8;
        doc.text(`   Date: ${f.creationDate}`, 10, y);
        y += 8;
        doc.text(`   Status: ${f.status}`, 10, y);
        y += 8;
        const messageLines = doc.splitTextToSize(`Message: ${f.message}`, 180); // 180 = max width
        doc.text(messageLines, 10, y);
        y += messageLines.length * 10; // Move y for next entry

        y += 12;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
  
      doc.save(`${username}_feedbacks.pdf`);
    }
  }
  
  




submitReply() {
throw new Error('Method not implemented.');
}

  selectedFeedback = signal<Feedback | null>(null);
  activeTab = signal<'tab1' | 'tab2'>('tab1');

  replyToFeedback(feedback: Feedback) {
    this.selectedFeedback.set(feedback);
    this.selectedTab = 'tab2';
  }
  selectedTab : string = 'tab1';
  searchQuery = signal('');
    sortBy = signal('newest');
    activeFeedback = signal<any>(null);
    showReportPopover = signal(false);

    currentPage = signal(0);
    currantPageIndex = signal(0); 
    itemsPerPage = 4;  

  feedbacks = signal([
    {id: 1, name: 'John Doe', category: 'Great service!', creationDate: '2023-10-01', message: 'Meet the OSI Model, the 7-layer cake of networking. Each layer plays a crucial role in moving data, ensuring smooth communication between devices. From physical cables (Layer 1) to web browsers (Layer 7), this model keeps the internet running!', status: 'pending'},
    {id: 2, name: 'Jane Smith', category: 'Needs improvement', creationDate: '2023-09-15', message: 'The service was okay, but there is room for improvement.', status: 'solved'},
    {id: 3, name: 'Alice Johnson', category: 'Excellent', creationDate: '2023-08-20', message: 'I am very satisfied with the service provided.', status: 'rejected'},
    {id: 4, name: 'Bob Brown', category: 'Not satisfied', creationDate: '2023-07-10', message: 'I was not happy with the service I received.', status: 'pending'},
    {id: 5, name: 'Charlie Davis', category: 'Great service!', creationDate: '2023-06-05', message: 'The service was fantastic! I will recommend it to others.', status: 'unsolved'},
    {id: 6, name: 'Diana Evans', category: 'Needs improvement', creationDate: '2023-05-15', message: 'I think the service could be better in some areas.', status: 'pending'},
    {id: 7, name: 'Ethan Foster', category: 'Excellent', creationDate: '2023-04-25', message: 'I am very pleased with the service I received.', status: 'pending'},
    {id: 8, name: 'Fiona Green', category: 'Not satisfied', creationDate: '2023-03-30', message: 'I was disappointed with the service.', status: 'pending'},
    {id: 9, name: 'George Harris', category: 'Great service!', creationDate: '2023-02-20', message: 'I had a great experience with your service.', status: 'pending'},
  ])

  filteredFeedbacks = computed(() => {
      const query = this.searchQuery().toLowerCase();
      const sort = this.sortBy();
      const page = this.currentPage();
      const perPage = this.itemsPerPage;
    
      // Start with full list
      let list = this.feedbacks();
    
      // Filter
      if (query) {
        list = list.filter(feedback =>
          feedback.name.toLowerCase().includes(query) ||
          feedback.category.toLowerCase().includes(query) ||
          feedback.message.includes(query)
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
      const maxPage = Math.floor(this.feedbacks().length / this.itemsPerPage);
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
      return Math.ceil(this.feedbacks.length / this.itemsPerPage);
    }
    
    
    hasPreviousPage(): boolean {
      return this.currentPage() > 0;
    }
    
    hasNextPage(): boolean {
      return this.currentPage() < this.totalPages() - 1;
    }

    setStatus(feedback: any, status: string) {
      feedback.status = status;
    }

    toggleMore(feedback : Feedback){

      if (this.activePopoverFeedback() === feedback) {
        this.activePopoverFeedback.set(null); 
      } else {
        this.activePopoverFeedback.set(feedback);
      }
    }

    activePopoverFeedback = signal<Feedback | null>(null);

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.more-wrapper')) {
            this.activePopoverFeedback.set(null);
        }
    }

    selectedMessage = signal<Feedback | null>(null);

    openMessagePopup(feedback: Feedback) {
      this.selectedMessage.set(feedback);
    }
  
    closePopup() {
      this.selectedMessage.set(null);
    }
  
  tooltipVisible = signal(false);
  tooltipX = signal(0);
  tooltipY = signal(0);

  showTooltip() {
    this.tooltipVisible.set(true);
  }

  hideTooltip() {
    this.tooltipVisible.set(false);
  }

  updateTooltipPosition(event: MouseEvent) {
    this.tooltipX.set(event.clientX + 12);
    this.tooltipY.set(event.clientY + 12);
  }

  csvTooltipVisible = signal(false);
csvTooltipX = signal(0);
csvTooltipY = signal(0);

showCsvTooltip() {
  this.csvTooltipVisible.set(true);
}

hideCsvTooltip() {
  this.csvTooltipVisible.set(false);
}

updateCsvTooltipPosition(event: MouseEvent) {
  this.csvTooltipX.set(event.clientX + 12);
  this.csvTooltipY.set(event.clientY + 12);
}
}
