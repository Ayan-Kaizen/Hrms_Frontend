import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveAttendanceComponent } from './leave-attendance.component';

describe('LeaveAttendanceComponent', () => {
  let component: LeaveAttendanceComponent;
  let fixture: ComponentFixture<LeaveAttendanceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LeaveAttendanceComponent]
    });
    fixture = TestBed.createComponent(LeaveAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
