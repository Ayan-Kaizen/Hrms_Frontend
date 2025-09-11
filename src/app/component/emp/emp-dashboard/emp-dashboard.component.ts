import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-emp-dashboard',
  templateUrl: './emp-dashboard.component.html',
  styleUrls: ['./emp-dashboard.component.css']
})
export class EmpDashboardComponent implements OnInit {
  isSidebarMinimized = false;

  // ✅ Declare this property with a default structure
  users: any = {
    name: 'Employee',   // fallback value if user is not found
    email: '',          // ensure email field is included
    employeeId: ''      // ensure employeeId field is included
  };

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.users = user;  // assign user data
      console.log('User email:', user.email);
      console.log('User employee ID:', user.id); // Assuming `id` is the employee ID
    } else {
      console.error('No user found');
      this.router.navigate(['/login']);  // Redirect to login if user is not found
    }
  }

  toggleSidebar(): void {
    this.isSidebarMinimized = !this.isSidebarMinimized;
  }

  logout(): void {
    this.authService.clearUser();  // Clear user data from AuthService and localStorage
    this.router.navigate(['/login']);
  }
}
