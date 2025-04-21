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


  
}