import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpDashboardComponent } from './emp-dashboard/emp-dashboard.component';
import { EmpSideNavbarComponent } from './emp-side-navbar/emp-side-navbar.component';
import { AssetManagementEmpComponent } from './asset-management-emp/asset-management-emp.component';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    EmpDashboardComponent,
    EmpSideNavbarComponent,
    AssetManagementEmpComponent
  ],

  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    CommonModule],
  exports: [EmpDashboardComponent]
})

export class EmployeeModule {}


