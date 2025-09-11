import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthGuard } from '../../services/auth.gaurd';
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
  selector: 'app-leave-dashboard',
  templateUrl: './leave-attendance.component.html',
  styleUrls: ['./leave-attendance.component.css']
})
export class LeaveAttendanceComponent implements OnInit {
  isSidebarMinimized = false;
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
    
    this.loadLeaveRequests();
  }
    onSidebarToggle(isMinimized: boolean) {
    this.isSidebarMinimized = isMinimized;
  }

  loadLeaveRequests(): void {
    this.http.get<{ leaveRequests: LeaveRequest[] }>('http://localhost:3000/api/get-leave-requests')
      .subscribe(response => {
        this.leaveRequests = response.leaveRequests;
      }, error => {
        console.error('Failed to load leave requests', error);
      });
  }

  updateLeaveStatus(leaveId: number, status: string): void {
    this.http.post<LeaveStatusResponse>('http://localhost:3000/api/update-leave-status', { leaveId, status })
      .subscribe(response => {
        alert(response.message);
        this.loadLeaveRequests(); // Refresh list
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
