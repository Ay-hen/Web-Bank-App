import { CommonModule, ViewportScroller } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})

export class NavbarComponent implements OnInit {
  activeSection = '';

  constructor(
    private router: Router,
    private viewportScroller: ViewportScroller
  ) {}


  ngOnInit() {

    if (this.router.url === '/' || this.router.url === '/home') {
      this.activeSection = 'home';
    }else{
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
    }
  }

  private isValidSection(section: string): boolean {
    return ['home', 'service', 'process', 'about'].includes(section);
  }

  handleNavClick(event: Event, sectionId: string) {
    event.preventDefault();
    
    if (this.router.url === '/' || this.router.url === `/home` ) {
      this.scrollToSection(sectionId);
    } else {
      // Navigate to home page with fragment
      this.activeSection = sectionId;
      this.router.navigate(['/'], { fragment: sectionId }).then(() => {
        // Wait for Angular to finish rendering before scrolling
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

  @HostListener('window:scroll')
  onScroll() {
    if (this.router.url === '/') {
      const sections = ['home', 'service', 'process', 'about'];
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          
          if (scrollPosition >= offsetTop - 100 && scrollPosition < offsetTop + offsetHeight - 100) {
            if (this.activeSection !== section) {
              this.activeSection = section;
              history.replaceState(null, '', `#${section}`);
            }
            break;
          }
        }
      }
    }
  }
}