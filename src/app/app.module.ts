import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './component/login/login.component';
import { EmpDashboardComponent } from './component/emp/emp-dashboard/emp-dashboard.component';
import { ForgotPasswordComponent } from './component/forgot-password/forgot-password.component';
import { AttendanceComponent } from './component/attendance/attendance.component';
import { MyLeaveComponent } from './component/emp/my-leave/my-leave.component';
import { ApplicationsComponent } from './component/applications/applications.component';
import { EventsComponent } from './component/events/events.component';
import { MyWorkspaceComponent } from './component/my-workspace/my-workspace.component';
import { EmployeeDetailsComponent } from './component/hr/employee-details/employee-details.component';
import { WorkspaceComponent } from './component/workspace/workspace.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatGridListModule } from '@angular/material/grid-list';
import { AdminDashboardComponent } from './component/admin-dashboard/admin-dashboard.component';
import { AssetManagementEmpComponent } from './component/emp/asset-management-emp/asset-management-emp.component';


import { LeaveAttendanceComponent } from './component/hr/leave-attendance/leave-attendance.component';
import { PayrollManagementComponent } from './component/payroll-management/payroll-management.component';
import { HrNoticeComponent } from './component/hr/hr-notice/hr-notice.component';
import { OverallPerformanceComponent } from './component/overall-performance/overall-performance.component';
import { RecruitmentComponent } from './component/recruitment/recruitment.component';
import { WorkTrackReportsComponent } from './component/work-track-reports/work-track-reports.component';
import { ProfileComponent } from './component/emp/profile/profile.component';
import {MatTableModule} from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import {MatInputModule} from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { HttpClientModule } from '@angular/common/http';
import { CreateEmployeeComponent } from './component/hr/create-employee/create-employee.component';
import { ApprovedLeavesComponent } from './component/hr/approved-leaves/approved-leaves.component';
import { RejectedLeavesComponent } from './component/hr/rejected-leaves/rejected-leaves.component';
import { CurrentProfileComponent } from './component/hr/current-profile/current-profile.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { CommonModule } from '@angular/common';
import { ViewCredComponent } from './component/hr/view-cred/view-cred.component';
import { HrProfileComponent } from './component/hr/hr-profile/hr-profile.component';
import { EmpSideNavbarComponent } from './component/emp/emp-side-navbar/emp-side-navbar.component';
import { HrModule } from './component/hr/hr.module';


import { MatIconModule } from '@angular/material/icon';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    EmpDashboardComponent,
    ForgotPasswordComponent,
    AttendanceComponent,
    MyLeaveComponent,
    ApplicationsComponent,
    EventsComponent,
    MyWorkspaceComponent,
    EmployeeDetailsComponent,
    WorkspaceComponent,
    AdminDashboardComponent,

    LeaveAttendanceComponent,
    PayrollManagementComponent,
    HrNoticeComponent,
    OverallPerformanceComponent,
    RecruitmentComponent,
    WorkTrackReportsComponent,
    MyLeaveComponent,
    ProfileComponent,
    CreateEmployeeComponent,
  
    ApprovedLeavesComponent,
    RejectedLeavesComponent,
    CurrentProfileComponent,
    ViewCredComponent,
    HrProfileComponent,
    EmpSideNavbarComponent,
    AssetManagementEmpComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatGridListModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    HttpClientModule,
    MatExpansionModule,
    CommonModule,
    HrModule,
    MatIconModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
