import { Component, OnInit } from '@angular/core';

interface Attendance {
  date: string;
  status: 'Present' | 'Absent';
}

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css']
})
export class AttendanceComponent implements OnInit {
  attendanceData: Attendance[] = [];
  totalDays: number = 30;
  totalAbsent: number = 0;
  attendancePercentage: number = 0;

  constructor() {}

  ngOnInit(): void {

    this.attendanceData = [
      { date: '2025-04-01', status: 'Present' },
      { date: '2025-04-02', status: 'Absent' },
      { date: '2025-04-03', status: 'Present' },

    ];


    this.calculateAttendance();
  }

  calculateAttendance() {
    let totalPresent = this.attendanceData.filter(record => record.status === 'Present').length;
    this.totalAbsent = this.attendanceData.filter(record => record.status === 'Absent').length;
    const totalPresentPercentage = (totalPresent / this.totalDays) * 100;
    this.attendancePercentage = parseFloat(totalPresentPercentage.toFixed(2)); 
  }
}
