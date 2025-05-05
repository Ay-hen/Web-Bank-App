import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { ServicesService } from '../services/services.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit, OnInit {
  ngAfterViewInit() {
    this.setupScrollAnimations();
  }

  private setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Fade in when element enters viewport
          entry.target.classList.add('visible');
          entry.target.classList.remove('hidden');
          
          // Animate icon with delay
          const icon = entry.target.querySelector('.process-icon');
          if (icon) {
            setTimeout(() => {
              icon.classList.add('icon-visible');
              icon.classList.remove('icon-hidden');
            }, 200);
          }
        } else {
          // Fade out when element leaves viewport (regardless of scroll direction)
          entry.target.classList.add('hidden');
          entry.target.classList.remove('visible');
          
          const icon = entry.target.querySelector('.process-icon');
          if (icon) {
            icon.classList.add('icon-hidden');
            icon.classList.remove('icon-visible');
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    });

    // Observe all process steps
    document.querySelectorAll('.process-step').forEach(el => {
      observer.observe(el);
    });
  }

  constructor(private authService: ServicesService, private router: Router) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getRole();

      switch (role?.toUpperCase()) {
        case 'ADMIN':
          this.router.navigate(['/dashboard']);
          break;
        case 'USER':
          this.router.navigate(['/user-feedback']);
          break;
        default:
          this.router.navigate(['/unauthorized']);
      }
    }
  }



  app : string = "The borrower submits a loan application to the bank, either in person, online, or through other channels. The application includes personal and financial information, such as income, employment history, credit score, and the purpose of the loan.";
  doc : string = "The bank requests supporting documents from the borrower, such as identification proof, income statements, bank statements, and collateral details (if applicable). The bank verifies the information provided to assess the borrower's creditworthiness and eligibility for the loan.";
  credit : string = "The bank conducts a credit assessment to evaluate the borrower's creditworthiness and ability to repay the loan. This process involves analyzing the borrower's credit history, income stability, debt-to-income ratio, and other factors.";
  loan : string = "If the borrower meets the bank's lending criteria and passes the credit assessment, the loan is approved. The bank determines the loan amount, interest rate, repayment term, and any associated fees.";
}