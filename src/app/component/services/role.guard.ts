
// import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
// import { Router } from '@angular/router';
// import { HttpClient } from '@angular/common/http';
// import { AuthService } from '../services/auth.service';
// import { Component } from '@angular/core';


// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
// })
// export class LoginComponent {
//   loginForm: FormGroup;
//   submitted = false;

//   constructor(
//     private fb: FormBuilder,
//     private router: Router,
//     private authService: AuthService,
//     private http: HttpClient
//   ) {
//     this.loginForm = this.fb.group({
//       email: ['', Validators.required], // Accepts email or employeeId
//       password: ['', Validators.required],
//     });
//   }

//   get f(): { [key: string]: AbstractControl } {
//     return this.loginForm.controls;
//   }


// onSubmit(): void {
//   this.submitted = true;
//   if (this.loginForm.invalid) return;

//   const email = this.f['email'].value;
//   const password = this.f['password'].value;

//   this.http.post<any>('http://localhost:3000/api/login', { email, password }).subscribe({
//     next: (res) => {
//       if (res.success) {
//         this.authService.setUser({
//           id: res.user.id,
//           name: res.user.name,
//           email: res.user.email,
//           grp_id: res.user.grp_id,
//         });

//         this.router.navigate([res.dashboardRoute || '/emp-dashboard']);
//       } else {
//         alert(res.message || 'Login failed');
//       }
//     },
//     error: (error) => {
//       if (error.status === 403) {
//         alert(error.error.message || 'Your account is paused. Please contact HR.');
//       } else if (error.status === 401) {
//         alert('Invalid email or password');
//       } else {
//         alert('Something went wrong. Please try again later.');
//       }
//     }
//   });
// }

// }



import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user = this.authService.getUser();

    if (user && user.grp_id === 2) {
      return true; // HR user
    }

    // Redirect if not HR
    this.router.navigate(['/emp-dashboard']);
    return false;
  }
}
