import { CommonModule, ViewportScroller } from '@angular/common';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  activeSection = '';
  private viewportScroller = inject(ViewportScroller);
  private router = inject(Router);

  ngOnInit() {
    if (this.router.url === '/' || this.router.url === '/home') {
      this.activeSection = 'home';
    } else {
      this.activeSection = '';
    }

    this.handleInitialState();
    
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.handleRouteChange(event.url);
      }
    });
  }

  private handleInitialState() {
    if (window.location.hash) {
      const sectionId = window.location.hash.substring(1);
      if (this.isValidSection(sectionId)) {
        this.activeSection = sectionId;
        setTimeout(() => this.scrollToSection(sectionId), 100);
      }
    }
  }

  private handleRouteChange(url: string) {
    if (url === '/' || url.startsWith('/#')) {
      const fragment = this.router.parseUrl(url).fragment;
      if (fragment && this.isValidSection(fragment)) {
        this.activeSection = fragment;
        setTimeout(() => {
          this.viewportScroller.scrollToAnchor(fragment);
        }, 0);
      } else {
        this.activeSection = 'home';
      }
    } else if (url === '/login') {
      this.activeSection = '';
    }
  }

  private isValidSection(section: string): boolean {
    return ['home', 'service', 'process', 'about'].includes(section);
  }

  handleNavClick(event: Event, sectionId: string) {
    event.preventDefault();
    
    if (this.router.url === '/' || this.router.url === `/home`) {
      this.scrollToSection(sectionId);
    } else {
      this.activeSection = sectionId;
      this.router.navigate(['/'], { fragment: sectionId }).then(() => {
        setTimeout(() => {
          this.scrollToSection(sectionId);
        }, 100);
      });
    }
  }

  scrollToSection(sectionId: string) {
    this.activeSection = sectionId;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      history.pushState(null, '', `#${sectionId}`);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Don't update active section if we're on the login page
    if (this.router.url === '/login') {
      return;
    }

    const sections = ['home', 'service', 'process', 'about'];
    let currentSection = '';
    sections.forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= 0 && rect.bottom >= 0) {
          currentSection = sectionId;
        }
      }
    });
    
    if (currentSection) {
      this.activeSection = currentSection;
      this.updateActiveLink(currentSection);
    }
  }

  updateActiveLink(sectionId: string) {
    const links = document.querySelectorAll('nav ul li a');
    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${sectionId}`) {
        link.classList.add('active');
      }
    });
  }
}