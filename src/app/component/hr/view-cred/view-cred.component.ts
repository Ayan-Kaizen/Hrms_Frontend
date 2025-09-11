import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-view-cred',
  templateUrl: './view-cred.component.html',
  styleUrls: ['./view-cred.component.css']
})
export class ViewCredComponent implements OnInit {

  isSidebarMinimized = false;
  isDropdownOpen = false;
  isCollapsed = false;

  employeeProfiles: any[] = [];
  searchTerm: string = '';
  selectedProfile: any = null;
  userEmail: string = '';
isPauseDisabled: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) { }

  logout(): void {
    this.authService.clearUser();
    this.router.navigate(['/login']);
  }


  ngOnInit(): void {
    this.getEmployeeProfiles();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  //  Fetch all employee profiles
getEmployeeProfiles() {
  this.http.get<any[]>('http://localhost:3000/api/users').subscribe({
    next: (res) => {
      console.log('API Response:', res);
      // Ensure each user has status and isUpdating properties
      this.employeeProfiles = res.map(user => ({
        ...user,
        status: user.status || 'active',
        isUpdating: false
      }));
    },
    error: (err) => {
      console.error('Error fetching employee profiles:', err);
    }
  });
}
  //  Filter profiles by name/email
filteredProfiles() {
  return this.employeeProfiles.filter(emp =>
    emp.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(this.searchTerm.toLowerCase())
  );
}


  //  Stub: Navigate to edit page (edit profile by email)
  editProfile(emp: any): void {
    console.log('Edit clicked for:', emp);
    // Uncomment below if editing is supported
    // this.router.navigate(['/edit-profile', emp.email]);
  }

  //  Delete employee by email
  deleteProfile(email: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.http.delete(`http://localhost:3000/api/users/${email}`).subscribe({
        next: () => {
          this.employeeProfiles = this.employeeProfiles.filter(emp => emp.email !== email);
          alert('User deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          alert('Failed to delete user');
        }
      });
    }
  }



// Remove the old pause() method and replace with:

toggleUserSession(email: string, currentStatus: string): void {
  const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
  const action = newStatus === 'paused' ? 'pause' : 'activate';
  
  if (!confirm(`Are you sure you want to ${action} this user's session?`)) {
    return;
  }

  // Find the employee and set loading state
  const employee = this.employeeProfiles.find(emp => emp.email === email);
  if (employee) {
    employee.isUpdating = true;
  }

  const body = { email, status: newStatus };

  this.http.post('http://localhost:3000/api/update-session-status', body).subscribe({
    next: (response: any) => {
      console.log(`Session ${action}d:`, response.message);
      
      // Update the local state
      if (employee) {
        employee.status = newStatus;
        employee.isUpdating = false;
      }
      
      alert(`User session has been ${action}d successfully.`);
    },
    error: (error) => {
      console.error(`Error ${action}ing session:`, error);
      
      // Reset loading state on error
      if (employee) {
        employee.isUpdating = false;
      }
      
      alert(`Error ${action}ing session. Please try again.`);
    }
  });
}



  //  View profile
  viewProfile(email: string): void {
    this.router.navigate(['/current-profile', email]);
  }

  // Close modal (if used)
  closeModal(): void {
    this.selectedProfile = null;
  }
}
