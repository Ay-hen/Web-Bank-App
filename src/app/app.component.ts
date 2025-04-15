import { ViewportScroller } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  router = inject(Router);
  constructor(private scroller: ViewportScroller) {}

  ngOnInit() {
    // Scroll to the top on route change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.scroller.scrollToPosition([0, 0]);
    });
  }

  scrollToSection(sectionId: string): void {
    this.scroller.scrollToAnchor(sectionId);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
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
    this.updateActiveLink(currentSection);
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