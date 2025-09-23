import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-my-profile-hr',
  templateUrl: './my-profile-hr.component.html',
  styleUrls: ['./my-profile-hr.component.css']
})
export class MyProfileHrComponent implements OnInit {

  // Sidebar
  isSidebarMinimized = false;

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
  dob: Date | null = null;
  doj: Date | null = null;

  // File Upload
  file: File | null = null;
  fileName = '';
  previewUrl: string | ArrayBuffer | null = null;
  aadharPdf: File | null = null;
  panPdf: File | null = null;
  salarySlipPdfs: FileList | null = null;
  educationPdfs: FileList | null = null;
  experiencePdfs: FileList | null = null;

  // Form state
  formSubmitted = false;
  userDetails: any = null;

  // Accordion Sections
  activeSection: string = 'personal'; // Profile display
  activeFormSection: string = 'personal'; // Form edit

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

    // Fetch profile from backend
    this.http.get(`https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/user/profile?email=${encodeURIComponent(email)}`)
      .subscribe(
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

  toggleSection(section: string): string {
    return this.activeFormSection === section ? '' : section;
  }

  // File change handlers
  onFileChange(event: Event) {
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
      reader.onload = () => this.previewUrl = reader.result;
      reader.readAsDataURL(this.file);
    }
  }

  onAadharUpload(event: any) { if (event.target.files.length) this.aadharPdf = event.target.files[0]; }
  onPanUpload(event: any) { if (event.target.files.length) this.panPdf = event.target.files[0]; }
  onSalaryUpload(event: any) { if (event.target.files.length) this.salarySlipPdfs = event.target.files; }
  onEducationUpload(event: any) { if (event.target.files.length) this.educationPdfs = event.target.files; }
  onExperienceUpload(event: any) { if (event.target.files.length) this.experiencePdfs = event.target.files; }

  // Submit form
  onSubmit() {
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
    if (this.file) formData.append('profileImage', this.file, this.file.name);
    if (this.aadharPdf) formData.append('aadharPdf', this.aadharPdf, this.aadharPdf.name);
    if (this.panPdf) formData.append('panPdf', this.panPdf, this.panPdf.name);
    if (this.salarySlipPdfs) Array.from(this.salarySlipPdfs).forEach(file => formData.append('salarySlips', file, file.name));
    if (this.educationPdfs) Array.from(this.educationPdfs).forEach(file => formData.append('educationDocs', file, file.name));
    if (this.experiencePdfs) Array.from(this.experiencePdfs).forEach(file => formData.append('experienceDocs', file, file.name));

    this.http.post('https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/profile', formData)
      .subscribe(
        () => { this.formSubmitted = true; alert('Profile updated successfully'); },
        (err) => { console.error(err); alert('Error submitting profile.'); }
      );
  }

  resetForm() {
    this.formSubmitted = false;
    this.file = null; this.fileName = ''; this.previewUrl = null;
    this.aadharPdf = null; this.panPdf = null; this.salarySlipPdfs = null; 
    this.educationPdfs = null; this.experiencePdfs = null;
  }

  logout() {
    this.authService.clearUser();
    this.router.navigate(['/login']);
  }
}
