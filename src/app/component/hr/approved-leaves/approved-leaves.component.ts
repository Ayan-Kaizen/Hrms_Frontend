import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  leaveCount: number;
  leaves: LeaveRequest[];
}

interface TooltipInfo {
  show: boolean;
  x: number;
  y: number;
  leaves: LeaveRequest[];
}

@Component({
  selector: 'app-approved-leaves',
  templateUrl: './approved-leaves.component.html',
  styleUrls: ['./approved-leaves.component.css']
})
export class ApprovedLeavesComponent implements OnInit {
  leaveRequests: LeaveRequest[] = [];
  searchTerm: string = '';
  statusFilter: string = '';
  
  // Calendar properties
  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Tooltip properties
  tooltip: TooltipInfo = {
    show: false,
    x: 0,
    y: 0,
    leaves: []
  };

constructor(
  private http: HttpClient,
  private authService: AuthService,
  private router: Router
) {}



  ngOnInit() {
    this.loadApprovedLeaveRequests();
  }
  
  logout(): void {
    this.authService.logout();  // Clear user data from AuthService and localStorage
    this.router.navigate(['/login']);  // Navigate to login page
  }

  loadApprovedLeaveRequests(): void {
    this.http.get<{ leaveRequests: LeaveRequest[] }>('http://localhost:3000/api/get-approved-leaves')
      .subscribe({
        next: (response) => {
          this.leaveRequests = response.leaveRequests;
          this.generateCalendar();
        },
        error: (error) => {
          console.error('Failed to load approved leave requests', error);
        }
      });
  }

  updateLeaveStatus(leaveId: number, status: string): void {
    this.http.post<LeaveStatusResponse>('http://localhost:3000/api/update-leave-status', { leaveId, status })
      .subscribe({
        next: (response) => {
          alert(response.message);
          this.loadApprovedLeaveRequests();
        },
        error: (error) => {
          alert('Error updating leave status');
          console.error(error);
        }
      });
  }

  rejectLeave(leaveId: number,): void {
    if (confirm('Are you sure you want to reject this accepted leave?')) {
      this.updateLeaveStatus(leaveId, 'Rejected');
    }
  }

  get filteredLeaveRequests() {
    return this.leaveRequests.filter(leave =>
      (leave.emailId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
       leave.reason?.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
      (this.statusFilter === '' || leave.status === this.statusFilter)
    );
  }

  // Calendar Methods
  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    this.calendarDays = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const leavesForDay = this.getLeavesForDate(currentDate);
      
      this.calendarDays.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: this.isToday(currentDate),
        leaveCount: leavesForDay.length,
        leaves: leavesForDay
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  getLeavesForDate(date: Date): LeaveRequest[] {
    return this.leaveRequests.filter(leave => {
      const fromDate = new Date(leave.fromDate);
      const toDate = new Date(leave.toDate);
      const checkDate = new Date(date);
      
      // Reset time to compare only dates
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);
      
      return checkDate >= fromDate && checkDate <= toDate;
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.generateCalendar();
  }
  

  getLeaveIntensityClass(leaveCount: number): string {
    if (leaveCount === 0) return '';
    if (leaveCount === 1) return 'leave-light';
    if (leaveCount === 2) return 'leave-medium';
    if (leaveCount >= 3) return 'leave-heavy';
    return '';
  }

  showTooltip(event: MouseEvent, leaves: LeaveRequest[]): void {
    if (leaves.length > 0) {
      this.tooltip = {
        show: true,
        x: event.clientX + 10,
        y: event.clientY - 10,
        leaves: leaves
      };
    }
  }

  hideTooltip(): void {
    this.tooltip.show = false;
  }



  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  getDurationText(fromDate: string, toDate: string): string {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const timeDiff = to.getTime() - from.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    
    if (dayDiff === 1) {
      return '1 day';
    } else {
      return `${dayDiff} days`;
    }
  }


}