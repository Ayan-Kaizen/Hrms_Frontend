import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from './component/services/role.guard';

// Common Components
import { LoginComponent } from './component/login/login.component';
import { ForgotPasswordComponent } from './component/forgot-password/forgot-password.component';
import { AuthGuard } from './component/services/auth.gaurd';

// Employee Components
import { EmpDashboardComponent } from './component/emp/emp-dashboard/emp-dashboard.component';
import { AttendanceComponent } from './component/attendance/attendance.component';
import { MyLeaveComponent } from './component/emp/my-leave/my-leave.component';
import { ApplicationsComponent } from './component/applications/applications.component';
import { EventsComponent } from './component/events/events.component';
import { ProfileComponent } from './component/emp/profile/profile.component';
import { AssetManagementEmpComponent } from './component/emp/asset-management-emp/asset-management-emp.component';

// HR Components
import { HrDashboardComponent } from './component/hr/hr-dashboard/hr-dashboard.component';
import { LeaveAttendanceComponent } from './component/hr/leave-attendance/leave-attendance.component';
import { HrNoticeComponent } from './component/hr/hr-notice/hr-notice.component';
import { EmployeeDetailsComponent } from './component/hr/employee-details/employee-details.component';
import { CreateEmployeeComponent } from './component/hr/create-employee/create-employee.component';
import { ApprovedLeavesComponent } from './component/hr/approved-leaves/approved-leaves.component';
import { RejectedLeavesComponent } from './component/hr/rejected-leaves/rejected-leaves.component';
import { CurrentProfileComponent } from './component/hr/current-profile/current-profile.component';
import { ViewCredComponent } from './component/hr/view-cred/view-cred.component';
import { HrProfileComponent } from './component/hr/hr-profile/hr-profile.component';
import { AssetManagementComponent } from './component/hr/asset-management-hr/asset-management-hr.component';

// Admin Components
import { AdminDashboardComponent } from './component/admin-dashboard/admin-dashboard.component';
import { PayrollManagementComponent } from './component/payroll-management/payroll-management.component';
import { OverallPerformanceComponent } from './component/overall-performance/overall-performance.component';
import { RecruitmentComponent } from './component/recruitment/recruitment.component';
import { WorkTrackReportsComponent } from './component/work-track-reports/work-track-reports.component';

const routes: Routes = [
  // Default route
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Common routes
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  // Employee routes
  { path: 'emp-dashboard', component: EmpDashboardComponent, canActivate: [AuthGuard] },
  { path: 'attendance', component: AttendanceComponent, canActivate: [AuthGuard] },
  { path: 'my-leaves', component: MyLeaveComponent, canActivate: [AuthGuard] },
  { path: 'applications', component: ApplicationsComponent, canActivate: [AuthGuard] },
  { path: 'events', component: EventsComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'asset-management-emp', component: AssetManagementEmpComponent, canActivate: [AuthGuard]},

  // HR routes

{ path: 'hr-dashboard', component: HrDashboardComponent, canActivate: [AuthGuard, RoleGuard] },
{ path: 'leave-attendance', component: LeaveAttendanceComponent, canActivate: [AuthGuard, RoleGuard] },
{ path: 'hr-notice', component: HrNoticeComponent, canActivate: [AuthGuard, RoleGuard] },
{ path: 'employee-details', component: EmployeeDetailsComponent, canActivate: [AuthGuard, RoleGuard] },
{ path: 'create-employee', component: CreateEmployeeComponent, canActivate: [AuthGuard, RoleGuard] },
{ path: 'approved-leaves', component: ApprovedLeavesComponent, canActivate: [AuthGuard, RoleGuard] },
{ path: 'rejected-leaves', component: RejectedLeavesComponent, canActivate: [AuthGuard, RoleGuard] },
{ path: 'current-profile/:email', component: CurrentProfileComponent, canActivate: [AuthGuard, RoleGuard] },
{ path: 'view-cred', component: ViewCredComponent, canActivate: [AuthGuard, RoleGuard] },
{ path: 'hr-profile', component: HrProfileComponent, canActivate: [AuthGuard, RoleGuard] },
{ path: 'asset-management-hr', component: AssetManagementComponent, canActivate: [AuthGuard, RoleGuard]},

  // Admin routes
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard] },
  { path: 'payroll-management', component: PayrollManagementComponent, canActivate: [AuthGuard] },
  { path: 'overall-performance', component: OverallPerformanceComponent, canActivate: [AuthGuard] },
  { path: 'recruitment', component: RecruitmentComponent, canActivate: [AuthGuard] },
  { path: 'work-track-reports', component: WorkTrackReportsComponent, canActivate: [AuthGuard] },

  // Wildcard fallback
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
