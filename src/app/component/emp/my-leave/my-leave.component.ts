import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-my-leave',
  templateUrl: './my-leave.component.html',
  styleUrls: ['./my-leave.component.css'],
  providers: [DatePipe]
})
export class MyLeaveComponent implements OnInit {

  today: string = ''; // 👈 used to prevent past date selection
  isSidebarMinimized = false;
  isLeaveModalOpen = false;
  remainingLeaves = 0;

  leaveRequest = {
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: '',
    emailId: '',
    status: 'Pending'
  };

  user = { name: 'Employee', email: '' };
  leaveRequests: any[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
     this.today = new Date().toISOString().split('T')[0];
    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.user = user;
    this.leaveRequest.emailId = user.email;
    this.today = this.datePipe.transform(new Date(), 'yyyy-MM-dd')!; // ✅ Set current date
    this.fetchLeaveRequests();
  }

  openLeaveModal(): void {
    this.isLeaveModalOpen = true;

    this.http.get<any>(`http://localhost:3000/api/remaining-leaves?emailId=${this.user.email}`)
      .subscribe({
        next: (res) => {
          this.remainingLeaves = res.remainingLeaves;
        },
        error: (err) => {
          console.error('Error fetching remaining leaves:', err);
          alert('Could not fetch leave balance');
        }
      });
  }

  closeLeaveModal(): void {
    this.isLeaveModalOpen = false;
    this.resetForm();
  }

  resetForm(): void {
    this.leaveRequest = {
      leaveType: '',
      fromDate: '',
      toDate: '',
      reason: '',
      emailId: this.user.email,
      status: 'Pending'
    };
  }

  get dateCount(): number {
    const from = new Date(this.leaveRequest.fromDate);
    const to = new Date(this.leaveRequest.toDate);
    const diffTime = to.getTime() - from.getTime();
    const days = Math.floor(diffTime / (1000 * 3600 * 24)) + 1;
    return days > 0 ? days : 0;
  }

  submitLeave(): void {
    const totalDays = this.dateCount;

    if (!this.leaveRequest.leaveType || !this.leaveRequest.fromDate || !this.leaveRequest.toDate || !this.leaveRequest.reason) {
      alert('Please fill in all required fields.');
      return;
    }

    if (totalDays > this.remainingLeaves) {
      alert(`You only have ${this.remainingLeaves} leave(s) left.`);
      return;
    }

    this.http.post('http://localhost:3000/api/leave-requests', this.leaveRequest).subscribe({
      next: () => {
        this.http.post('http://localhost:3000/api/update-leave-balance', {
          email: this.user.email,
          days: totalDays
        }).subscribe({
          next: () => {
            alert('Leave submitted and balance updated!');
            this.closeLeaveModal();
            this.fetchLeaveRequests();
          },
          error: err => {
            console.error('Failed to update balance:', err);
            alert('Leave request saved but balance update failed.');
          }
        });
      },
      error: err => {
        console.error('Error submitting leave:', err);
        alert('Failed to submit leave request.');
      }
    });
  }

  fetchLeaveRequests(): void {
    const email = this.authService.getLoggedInUserEmail();
    this.http.get<any[]>(`http://localhost:3000/api/leave-requests-emp?emailId=${email}`)
      .subscribe({
        next: data => {
          this.leaveRequests = data.map(leave => ({
            ...leave,
            formattedFromDate: this.datePipe.transform(leave.fromDate, 'MM/dd/yyyy'),
            formattedToDate: this.datePipe.transform(leave.toDate, 'MM/dd/yyyy')
          }));
        },
        error: err => {
          console.error('Error fetching requests:', err);
        }
      });
  }

  cancelLeaveRequest(id: number): void {
    const email = this.authService.getLoggedInUserEmail();
    if (confirm('Cancel this leave request?')) {
      this.http.delete(`http://localhost:3000/api/leave-requests-del?emailId=${email}&id=${id}`)
        .subscribe({
          next: () => this.fetchLeaveRequests(),
          error: err => console.error('Cancel failed:', err)
        });
    }
  }

  logout(): void {
    this.authService.clearUser();
    this.router.navigate(['/login']);
  }
}
