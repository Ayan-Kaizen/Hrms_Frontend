import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  private userKey = 'user';
  private timeout: any;
  private sessionTimeoutInMinutes = 30;

  constructor(private router: Router, private ngZone: NgZone) {
    this.initInactivityWatcher();
  }

  // Save entire user object
  setUser(user: { id: number; name: string; email: string; grp_id: number }): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.setEmailAndId(user.id.toString(), user.email);
    this.resetTimeout();
  }

  // Get full user object
  getUser(): { id: number; name: string; email: string; grp_id: number } | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  // Remove user data
  clearUser(): void {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('employeeId');
    localStorage.removeItem('email');
  }

  // Manual logout
  logout(): void {
    this.clearUser();
    this.clearTimeout();
    this.router.navigate(['/login']);
  }

  // Is logged in?
  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  // Get only logged-in user's email
  getLoggedInUserEmail(): string {
    const user = this.getUser();
    return user ? user.email : '';
  }

  // Store email and ID separately (optional, used for quick lookup)
  setEmailAndId(employeeId: string, email: string): void {
    localStorage.setItem('employeeId', employeeId);
    localStorage.setItem('email', email);
  }

  getEmailAndId(): { employeeId: string | null; email: string | null } {
    const user = this.getUser();
    return user
      ? { employeeId: user.id.toString(), email: user.email }
      : { employeeId: null, email: null };
  }

  // Store extra data if needed
  setAdditionalData(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  getAdditionalData(key: string): string | null {
    return localStorage.getItem(key);
  }

  
  // Watch for user activity
  private initInactivityWatcher(): void {
    this.ngZone.runOutsideAngular(() => {
      const events = ['mousemove', 'keydown', 'click', 'touchstart'];
      events.forEach((event) =>
        window.addEventListener(event, () => this.resetTimeout())
      );
    });
  }

  // Reset inactivity timer
  private resetTimeout(): void {
    this.clearTimeout();
    if (this.isLoggedIn()) {
      this.timeout = setTimeout(() => {
        this.ngZone.run(() => {
          alert('Session expired due to inactivity. Logging out.');
          this.logout();
        });
      }, this.sessionTimeoutInMinutes * 60 * 1000); // 15 minutes
    }
  }

  // Clear timeout manually (on logout or route change)
  private clearTimeout(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
}


