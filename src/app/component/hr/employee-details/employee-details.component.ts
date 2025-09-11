import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-hr-dashboard',
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.css']
})
export class EmployeeDetailsComponent implements OnInit {
  
  isSidebarMinimized = false;
  isDropdownOpen = false;
  isCollapsed = false;
  employeeProfiles: any[] = [];
  searchTerm: string = '';
  selectedProfile: any = null; // To store selected profile for modal view

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
    this.fetchProfiles();
  }
    onSidebarToggle(isMinimized: boolean) {
    this.isSidebarMinimized = isMinimized;
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // 📥 Fetch employee profiles from API
  fetchProfiles() {
    this.http.get<any>('http://localhost:3000/api/employee-profiles').subscribe({
      next: (res) => {
        if (res.success) {
          this.employeeProfiles = res.data;
        }
      },
      error: (err) => {
        console.error('Error fetching profiles', err);
      }
    });
  }

  // 🔍 Filter employee list by search term
  filteredProfiles() {
    if (!this.searchTerm) return this.employeeProfiles;

    const term = this.searchTerm.toLowerCase();
    return this.employeeProfiles.filter(emp =>
      emp.name?.toLowerCase().includes(term) ||
      emp.email?.toLowerCase().includes(term) ||
      emp.department?.toLowerCase().includes(term)
    );
  }

  // ✏️ Edit employee profile (stub for navigation or modal)
  editProfile(emp: any) {
    console.log('Edit clicked for:', emp);
    // Example: this.router.navigate(['/edit', emp.email]);
  }

  // 🗑️ Delete employee profile by email
  deleteProfile(email: string) {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.http.delete(`http://localhost:3000/api/employee-profiles/email/${email}`).subscribe({
        next: () => {
          this.employeeProfiles = this.employeeProfiles.filter(emp => emp.email !== email);
          alert('Employee deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting profile:', err);
          alert('Failed to delete employee');
        }
      });
    }
  }

  // 📄 View employee profile in modal
  viewProfile(email: string) {
    this.router.navigate(['/current-profile', email]);
  }

  // ❌ Close the modal
  closeModal() {
    this.selectedProfile = null; // Reset the modal content
  }
}
