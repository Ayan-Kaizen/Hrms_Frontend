import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button'; 
import { HrDashboardComponent } from './hr-dashboard/hr-dashboard.component';
import { HrSideNavbarComponent } from './hr-side-navbar/hr-side-navbar.component';
import { AssetManagementComponent  } from './asset-management-hr/asset-management-hr.component';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';



import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';



// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';


@NgModule({
  declarations: [
    HrDashboardComponent,
    HrSideNavbarComponent,
    AssetManagementComponent ,
  ],

  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    ReactiveFormsModule ,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    FormsModule
  ],

  exports: [
    HrDashboardComponent,
    HrSideNavbarComponent,
    AssetManagementComponent
  ],
})
export class HrModule {}