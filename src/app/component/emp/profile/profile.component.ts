import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
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

  // Document Files for initial upload form
  aadharPdf: File | null = null;
  panPdf: File | null = null;
  salarySlipPdfs: FileList | null = null;
  educationPdfs: FileList | null = null;
  experiencePdfs: FileList | null = null;

  // Document Files for update form
  updateAadharPdf: File | null = null;
  updatePanPdf: File | null = null;
  updateSalarySlipPdfs: FileList | null = null;
  updateEducationPdfs: FileList | null = null;
  updateExperiencePdfs: FileList | null = null;


  // Dates
  dob: Date | null = null;
  doj: Date | null = null;

  // Profile Image Upload
  file: File | null = null;
  fileName = '';
  previewUrl: string | ArrayBuffer | null = null;

  // Sidebar
  isSidebarMinimized = false;
  imageLoadError = false;

  // Form state
  formSubmitted = false;
  userDetails: any = null;

  // Accordion control
  activeSection: string = 'personal'; // default open section for profile display
  activeFormSection: string = 'personal'; // default open section for profile creation form
  showDocumentUpdateForm: boolean = false; // Controls visibility of the document update modal/section

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) { }

  logout(): void {
    this.authService.clearUser();
    this.router.navigate(['/login']);
  }



  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
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
        // If profile doesn't exist, allow user to fill the form
        this.userDetails = null;
      }
    );
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
    // Append profile fields
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

    // Append profile image
    if (this.file) {
      formData.append('profileImage', this.file, this.file.name);
    }

    // Append initial document uploads
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

    this.http.post('http://localhost:3000/api/profile', formData).subscribe(
      (response) => {
        console.log('✅ Profile submitted successfully:', response);
        this.formSubmitted = true;
        this.loadUserProfile(); // Reload profile after submission
        alert('Profile created/updated successfully.');
      },
      (error) => {
        console.error('❌ Error submitting profile:', error);
        alert('Error submitting profile. Please try again.');
      }
    );
  }

  resetForm(): void {
    this.formSubmitted = false;
    // Reset all form fields and file inputs
    this.employeeId = '';
    this.name = '';
    this.contactNo = '';
    this.email = '';
    this.alternateContact = '';
    this.emergencyContact = '';
    this.bloodGroup = '';
    this.permanentAddress = '';
    this.currentAddress = '';
    this.aadharNumber = '';
    this.panNumber = '';
    this.department = '';
    this.jobRole = '';
    this.dob = null;
    this.doj = null;
    this.file = null;
    this.fileName = '';
    this.previewUrl = null;
    this.aadharPdf = null;
    this.panPdf = null;
    this.salarySlipPdfs = null;
    this.educationPdfs = null;
    this.experiencePdfs = null;
    // Hide update form if visible
    this.showDocumentUpdateForm = false;
  }


  toggleSection(section: string): string {
    return this.activeFormSection === section ? '' : section;
  }

  // Initial Document Upload Handlers (for the main profile creation form)
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
  onExperienceUpload(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.experiencePdfs = files;
    }
  }


  // Document Update Logic
  toggleDocumentUpdateForm(): void {
    this.showDocumentUpdateForm = !this.showDocumentUpdateForm;
    // Reset any selected files when opening/closing the form
    this.updateAadharPdf = null;
    this.updatePanPdf = null;
    this.updateSalarySlipPdfs = null;
    this.updateEducationPdfs = null;
    this.updateExperiencePdfs = null;
  }

  // Handlers for the document update form
  onAadharUpdate(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.updateAadharPdf = files[0];
    }
  }

  onPanUpdate(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.updatePanPdf = files[0];
    }
  }

  onSalaryUpdate(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.updateSalarySlipPdfs = files;
    }
  }

  onEducationUpdate(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.updateEducationPdfs = files;
    }
  }

  onExperienceUpdate(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.updateExperiencePdfs = files;
    }
  }

  onDocumentUpdateSubmit(): void {
    const formData = new FormData();
    const userEmail = this.authService.getUser()?.email;

    if (!userEmail) {
      alert('User email not found. Cannot update documents.');
      return;
    }

    formData.append('email', userEmail); // Crucial to identify the user on the backend

    // Append only the files that were selected for update
    if (this.updateAadharPdf) {
      formData.append('aadharPdf', this.updateAadharPdf, this.updateAadharPdf.name);
    }
    if (this.updatePanPdf) {
      formData.append('panPdf', this.updatePanPdf, this.updatePanPdf.name);
    }
    if (this.updateSalarySlipPdfs) {
      Array.from(this.updateSalarySlipPdfs).forEach(file => formData.append('salarySlips', file, file.name));
    }
    if (this.updateEducationPdfs) {
      Array.from(this.updateEducationPdfs).forEach(file => formData.append('educationDocs', file, file.name));
    }
    if (this.updateExperiencePdfs) {
      Array.from(this.updateExperiencePdfs).forEach(file => formData.append('experienceDocs', file, file.name));
    }

    // Check if any files are selected for update
    if (formData.has('aadharPdf') || formData.has('panPdf') || formData.has('salarySlips') || formData.has('educationDocs') || formData.has('experienceDocs')) {
      this.http.post('http://localhost:3000/api/profile/update-documents', formData).subscribe(
        (response) => {
          console.log('✅ Documents updated successfully:', response);
          alert('Documents updated successfully!');
          this.toggleDocumentUpdateForm(); // Close the update form
          this.loadUserProfile(); // Reload profile to show updated documents
        },
        (error) => {
          console.error('❌ Error updating documents:', error);
          alert('Error updating documents. Please try again.');
        }
      );
    } else {
      alert('No documents selected for update.');
    }
  }

}