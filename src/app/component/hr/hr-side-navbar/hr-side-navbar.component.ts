// hr-side-navbar.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hr-side-navbar',
  templateUrl: './hr-side-navbar.component.html',
  styleUrls: ['./hr-side-navbar.component.css']
})
export class HrSideNavbarComponent {
  @Input() isMinimized: boolean = false;
  @Output() toggleMinimized = new EventEmitter<boolean>();

  constructor(private router: Router) {}

  toggleSidebar() {
    this.isMinimized = !this.isMinimized;
    this.toggleMinimized.emit(this.isMinimized);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // Navigation items for easier management
  navItems = [
    {
      label: 'Profile',
      route: '/hr-profile',
      icon: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
    },
    {
      label: 'Employee Database',
      route: '/employee-details',
      icon: 'M7.5 6.5C7.5 8.981 9.519 11 12 11s4.5-2.019 4.5-4.5S14.481 2 12 2 7.5 4.019 7.5 6.5zM20 21h-2v-2c0-2.209-1.791-4-4-4H10c-2.209 0-4 1.791-4 4v2H4v-2c0-3.313 2.687-6 6-6h4c3.313 0 6 2.687 6 6v2z'
    },
    {
      label: 'Leave Management',
      route: '/leave-attendance',
      icon: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z'
    },
    {
      label: 'Asset Management',
      route: '/asset-management-hr',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2zm3 3a1 1 0 011-1h1a1 1 0 010 2H7a1 1 0 01-1-1zm4-1a1 1 0 000 2h4a1 1 0 100-2h-4z'
    }
  ];
}