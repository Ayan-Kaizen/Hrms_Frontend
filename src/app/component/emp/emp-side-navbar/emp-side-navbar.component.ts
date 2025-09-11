// emp-side-navbar.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-emp-side-navbar',
  templateUrl: './emp-side-navbar.component.html',
  styleUrls: ['./emp-side-navbar.component.css']
})
export class EmpSideNavbarComponent implements OnInit {
  @Input() isSidebarMinimized: boolean = false;
  @Output() toggleMinimized = new EventEmitter<boolean>();

  users: any = {
    name: 'Employee',   
    email: '',          
    employeeId: ''     
  };

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.users = user;  
      console.log('User email:', user.email);
      console.log('User employee ID:', user.id); 
    } else {
      console.error('No user found');
      this.router.navigate(['/login']); 
    }
  }

  toggleSidebar(): void {
    this.isSidebarMinimized = !this.isSidebarMinimized;
    this.toggleMinimized.emit(this.isSidebarMinimized);
  }

  logout(): void {
    this.authService.clearUser();  
    this.router.navigate(['/login']);
  }

  // Get user initials for minimized logo
  getUserInitials(): string {
    if (this.users && this.users.name) {
      const nameParts = this.users.name.trim().split(' ');
      if (nameParts.length >= 2) {
        // First letter of first name + first letter of last name
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
      } else if (nameParts.length === 1) {
        // Just first two letters of single name
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    }
    return 'EMP'; // Fallback
  }

  // Navigation items for easier management
  navItems = [
    {
      label: 'Profile',
      route: '/profile',
      icon: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
    },
    {
      label: 'My Leave',
      route: '/my-leaves',
      icon: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z'
    },
    {
      label: 'Asset Management',
      route: '/asset-management-emp',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2zm3 3a1 1 0 011-1h1a1 1 0 010 2H7a1 1 0 01-1-1zm4-1a1 1 0 000 2h4a1 1 0 100-2h-4z'
    }
  ];
}