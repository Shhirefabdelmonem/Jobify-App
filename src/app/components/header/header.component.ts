import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isLoggedIn = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Subscribe to authentication state changes
    this.authService.isAuthenticated$.subscribe(
      isAuthenticated => {
        this.isLoggedIn = isAuthenticated;
      }
    );
  }

  logout(): void {
    console.log('Logging out...');
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful');
        this.router.navigate(['/sign-in']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if there's an error, navigate to sign-in
        this.router.navigate(['/sign-in']);
      }
    });
  }
}
