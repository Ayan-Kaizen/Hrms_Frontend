import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
interface LeaveRequest {
  id: number;
  emailId: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason?: string;
  status: string;
}

interface LeaveStatusResponse {
  message: string;
}

@Component({
  selector: 'app-rejected-leaves',
  templateUrl: './rejected-leaves.component.html',
  styleUrls: ['./rejected-leaves.component.css']
})
export class RejectedLeavesComponent implements OnInit {
  leaveRequests: LeaveRequest[] = [];
  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) { }

  logout(): void {
    this.authService.clearUser();
    this.router.navigate(['/login']);
  }

  ngOnInit() {
    this.loadRejectedLeaveRequests(); // Change the method to load only rejected leaves
  }

  loadRejectedLeaveRequests(): void {
    // Fetch only rejected leaves from the backend API
    this.http.get<{ leaveRequests: LeaveRequest[] }>('http://localhost:3000/api/get-rejected-leaves')
      .subscribe(response => {
        this.leaveRequests = response.leaveRequests;
      }, error => {
        console.error('Failed to load rejected leave requests', error);
      });
  }

  updateLeaveStatus(leaveId: number, status: string): void {
    this.http.post<LeaveStatusResponse>('http://localhost:3000/api/update-leave-status', { leaveId, status })
      .subscribe(response => {
        alert(response.message);
        this.loadRejectedLeaveRequests(); // Refresh list to reflect the changes
      }, error => {
        alert('Error updating leave status');
        console.error(error);
      });
  }

  searchTerm: string = '';
  statusFilter: string = '';

  get filteredLeaveRequests() {
    return this.leaveRequests.filter(leave =>
      (leave.emailId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
       leave.reason?.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
      (this.statusFilter === '' || leave.status === this.statusFilter)
    );
  }
}
