// create-employee.component.ts
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-create-employee',
  templateUrl: './create-employee.component.html',
  styleUrls: ['./create-employee.component.css']
})
export class CreateEmployeeComponent {
  employeeData = {
    name: '',
    email: '',
    password: '',
    grp_id: '',
    employeeId: ''
  };

  constructor(
    private http: HttpClient,   
    private authService: AuthService,
    private router: Router) {}

    
  logout(): void {
    this.authService.logout();  // Clear user data from AuthService and localStorage
    this.router.navigate(['/login']);  // Navigate to login page
  }
  // Handle form submission
  createEmployee() {
    console.log('Sending employee data:', this.employeeData);

    // Send the form data to the backend
    this.http.post<any>('http://localhost:3000/api/create-employee', this.employeeData).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Employee created successfully');
          this.router.navigate(['/employee-details']); // Redirect to employee details page
        } else {
          alert('Failed to create employee: ' + res.message);
        }
      },
      error: (err) => {
        console.error('Error creating employee:', err);
        alert('Error creating employee');
      }
    });
  }
}
