import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HrSideNavbarComponent } from '../hr-side-navbar/hr-side-navbar.component';

@Component({
  selector: 'app-hr-dashboard',
  templateUrl: './hr-dashboard.component.html',
  styleUrls: ['./hr-dashboard.component.css']
})
export class HrDashboardComponent implements AfterViewInit {
  isSidebarMinimized = false;


  @ViewChild(HrSideNavbarComponent) sidebarComponent!: HrSideNavbarComponent;

  constructor(private authService: AuthService, private router: Router) {}

  ngAfterViewInit(): void {
    // Optional: Log or call something on the sidebar
    console.log('Sidebar component loaded:', this.sidebarComponent);
  }

  toggleSidebar(): void {
    this.isSidebarMinimized = !this.isSidebarMinimized;

    // Optional: Call method on sidebar if defined
    if (this.sidebarComponent) {
      this.sidebarComponent.isMinimized = this.isSidebarMinimized;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
