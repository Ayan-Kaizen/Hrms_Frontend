import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  otpSent = false;
  otpVerified = false;
  passwordMismatch = false;

  constructor(private fb: FormBuilder) {
    this.forgotForm = this.fb.group({
      contact: ['', Validators.required],
      otp: [''],
      newPassword: [''],
      confirmPassword: [''],
    });
  }

  onSubmit() {
    if (!this.otpSent) {

      console.log('Sending OTP to:', this.forgotForm.value.contact);
      this.otpSent = true;
    } else if (!this.otpVerified) {

      const enteredOtp = this.forgotForm.value.otp;
      if (enteredOtp === '123456') {
        this.otpVerified = true;
      } else {
        alert('Incorrect OTP, please try again.');
      }
    } else {
      
      const newPassword = this.forgotForm.value.newPassword;
      const confirmPassword = this.forgotForm.value.confirmPassword;

      if (newPassword !== confirmPassword) {
        this.passwordMismatch = true;
      } else {
        console.log('Password updated successfully to:', newPassword);
        alert('Password updated successfully!');
      }
    }
  }
}
