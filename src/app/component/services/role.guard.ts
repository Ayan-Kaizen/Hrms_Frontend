
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

//   this.http.post<any>('https://hrmss-bvc3gvc6e9deexhq.centralus-01.azurewebsites.net/api/login', { email, password }).subscribe({
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
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user = this.authService.getUser();

    if (!user) {
      // No user found → go to login
      this.router.navigate(['/login']);
      return false;
    }

    const isHR = user.grp_id === 2;
    const isArjun = user.email?.toLowerCase().trim() === 'arjun@kaizenque.com';

    if (isHR || isArjun) {
      return true; // Allow access
    }

    // If not HR or not Arjun → deny access
    this.router.navigate(['/login']); // Or redirect to unauthorized page
    return false;
  }
}



