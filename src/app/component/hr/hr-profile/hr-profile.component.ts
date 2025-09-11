import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './hr-profile.component.html',
  styleUrls: ['./hr-profile.component.css']
})

export class HrProfileComponent implements OnInit {
  
  // Profile Fields
  employeeId = '';
  name = '';
  contactNo = '';
  email = '';
  alternateContact = '';
  emergencyContact = '';
  bloodGroup = '';
  permanentAddress = '';
  currentAddress = '';
  aadharNumber = '';
  panNumber = '';
  department = '';
  jobRole = '';
  aadharPdf: File | null = null;
  panPdf: File | null = null;
  salarySlipPdfs: FileList | null = null;
  educationPdfs: FileList | null = null;
  experiencePdfs: FileList | null = null;

  // Dates
  dob: Date | null = null;
  doj: Date | null = null;

  // File Upload
  file: File | null = null;
  fileName = '';
  previewUrl: string | ArrayBuffer | null = null;

  // Sidebar
  isSidebarMinimized = false;
  imageLoadError = false;

  // Form state
  formSubmitted = false;

  userDetails: any = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const loggedUser = this.authService.getUser();
    if (!loggedUser || !loggedUser.email) {
      alert('User not logged in. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }
    
    

    const email = loggedUser.email;

    this.http.get(`http://localhost:3000/api/user/profile?email=${encodeURIComponent(email)}`).subscribe(
      (response: any) => {
        this.userDetails = response;
        if (this.userDetails) {
          this.employeeId = this.userDetails.employeeId || '';
          this.name = this.userDetails.name;
          this.contactNo = this.userDetails.contactNo;
          this.email = this.userDetails.email;
          this.alternateContact = this.userDetails.alternateContact;
          this.emergencyContact = this.userDetails.emergencyContact;
          this.bloodGroup = this.userDetails.bloodGroup;
          this.permanentAddress = this.userDetails.permanentAddress;
          this.currentAddress = this.userDetails.currentAddress;
          this.aadharNumber = this.userDetails.aadharNumber;
          this.panNumber = this.userDetails.panNumber;
          this.department = this.userDetails.department;
          this.jobRole = this.userDetails.jobRole;
          this.dob = this.userDetails.dob ? new Date(this.userDetails.dob) : null;
          this.doj = this.userDetails.doj ? new Date(this.userDetails.doj) : null;
        }
      },
      (error) => {
        console.error('❌ Error fetching user details:', error);
        alert('Error fetching user details. Please try again.');
      }
    );
  }

    onSidebarToggle(isMinimized: boolean) {
    this.isSidebarMinimized = isMinimized;
  }

  toggleSidebar(): void {
    this.isSidebarMinimized = !this.isSidebarMinimized;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const selectedFile = input.files[0];
      if (selectedFile.size > 2 * 1024 * 1024) {
        alert('File too large. Max 2MB allowed.');
        return;
      }

      this.file = selectedFile;
      this.fileName = selectedFile.name;

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(this.file);
    }
  }

  onSubmit(): void {
    const formData = new FormData();
    formData.append('employeeId', this.employeeId);
    formData.append('name', this.name);
    formData.append('contactNo', this.contactNo);
    formData.append('email', this.email);
    formData.append('alternateContact', this.alternateContact);
    formData.append('emergencyContact', this.emergencyContact);
    formData.append('bloodGroup', this.bloodGroup);
    formData.append('permanentAddress', this.permanentAddress);
    formData.append('currentAddress', this.currentAddress);
    formData.append('aadharNumber', this.aadharNumber);
    formData.append('panNumber', this.panNumber);
    formData.append('department', this.department);
    formData.append('jobRole', this.jobRole);
    formData.append('dob', this.dob ? this.dob.toISOString() : '');
    formData.append('doj', this.doj ? this.doj.toISOString() : '');

    // Append files
    if (this.aadharPdf) {
      formData.append('aadharPdf', this.aadharPdf, this.aadharPdf.name);
    }
    if (this.panPdf) {
      formData.append('panPdf', this.panPdf, this.panPdf.name);
    }
    if (this.salarySlipPdfs) {
      Array.from(this.salarySlipPdfs).forEach(file => formData.append('salarySlips', file, file.name));
    }
    if (this.educationPdfs) {
      Array.from(this.educationPdfs).forEach(file => formData.append('educationDocs', file, file.name));
    }
    if (this.experiencePdfs) {
      Array.from(this.experiencePdfs).forEach(file => formData.append('experienceDocs', file, file.name));
    }
    if (this.file) {
      formData.append('profileImage', this.file, this.file.name);
    }

    this.http.post('http://localhost:3000/api/profile', formData).subscribe(
      (response) => {
        console.log('✅ Profile submitted successfully:', response);
        this.formSubmitted = true;
        alert('Profile updated successfully.');
      },
      (error) => {
        console.error('❌ Error submitting profile:', error);
        alert('Error submitting profile. Please try again.');
      }
    );
  }


  resetForm(): void {
    this.formSubmitted = false;
    this.file = null;
    this.fileName = '';
    this.previewUrl = null;
    this.aadharPdf = null;
    this.panPdf = null;
    this.salarySlipPdfs = null;
    this.educationPdfs = null;
    this.experiencePdfs = null;
  }

  logout(): void {
    this.authService.clearUser();
    this.router.navigate(['/login']);
  }
  activeSection: string = 'personal'; // default open section

  activeFormSection: string = 'personal';

toggleSection(section: string): string {
  return this.activeFormSection === section ? '' : section;
}

// Inside ProfileComponent

onAadharUpload(event: any): void {
  const files = event.target.files;
  if (files && files.length > 0) {
    this.aadharPdf = files[0];
  }
}

onPanUpload(event: any): void {
  const files = event.target.files;
  if (files && files.length > 0) {
    this.panPdf = files[0];
  }
}

onSalaryUpload(event: any): void {
  const files = event.target.files;
  if (files && files.length > 0) {
    this.salarySlipPdfs = files;
  }
}

onEducationUpload(event: any): void {
  const files = event.target.files;
  if (files && files.length > 0) {
    this.educationPdfs = files;
  }
}



onDocUpload(event: any, type: string): void {
  const files = event.target.files;
  switch (type) {
    case 'profileImage':
      this.file = files[0];
      break;
    case 'aadharPdf':
      this.aadharPdf = files[0];
      break;
    case 'panPdf':
      this.panPdf = files[0];
      break;
    case 'salarySlips':
      this.salarySlipPdfs = files;
      break;
    case 'educationDocs':
      this.educationPdfs = files;
      break;
    case 'experienceDocs':
      this.experiencePdfs = files;
      break;
  }
}

}