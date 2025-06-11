import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LogInDTO } from '../../services/auth.service';
import { GoogleService } from '../../services/google.service';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
})
export class SignInComponent {
  signInForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private googleService: GoogleService
  ) {
    this.signInForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
      },
      { updateOn: 'blur' }
    );

    // Test Google API setup on component initialization
    this.testGoogleSetup();
  }

  private async testGoogleSetup() {
    try {
      const setupInfo = await this.googleService.testGoogleApiSetup();
      console.log('Google API setup test results:', setupInfo);
    } catch (error) {
      console.error('Google API setup test failed:', error);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  signInWithGoogle() {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Starting Google Sign-In...');

    this.authService
      .signInWithGoogle()
      .then(() => {
        console.log('Google sign-in completed successfully');
      })
      .catch((error) => {
        console.error('Google sign-in error details:', error);

        // Handle specific error messages from backend
        if (error.error?.message) {
          if (error.error.message.includes('Invalid Google token')) {
            this.errorMessage =
              'Google authentication failed. Please try again.';
          } else if (
            error.error.message.includes('Failed to create user account')
          ) {
            this.errorMessage =
              'Failed to create your account. Please try again later.';
          } else {
            this.errorMessage = error.error.message;
          }
        } else if (error.message?.includes('No valid Google credential')) {
          this.errorMessage =
            'Failed to get Google credentials. Please try again.';
        } else if (error.message?.includes('not initialized')) {
          this.errorMessage =
            'Google Sign-In is loading. Please try again in a moment.';
        } else if (
          error.message?.includes('popup') ||
          error.message?.includes('blocked')
        ) {
          this.errorMessage =
            'Please allow popups for this site and try again.';
        } else if (error.message?.includes('timeout')) {
          this.errorMessage = 'Google Sign-In timed out. Please try again.';
        } else if (
          error.message?.includes('closed') ||
          error.message?.includes('cancelled') ||
          error.message?.includes('dismissed')
        ) {
          this.errorMessage = 'Sign-in was cancelled. Please try again.';
        } else if (error.message?.includes('credential')) {
          this.errorMessage =
            'Failed to verify Google credentials. Please try again.';
        } else if (
          error.message?.includes('network') ||
          error.message?.includes('fetch')
        ) {
          this.errorMessage =
            'Network error. Please check your connection and try again.';
        } else {
          this.errorMessage =
            'Failed to sign in with Google. Please try again or use email/password.';
        }
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  onSubmit() {
    if (this.signInForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const loginData: LogInDTO = {
        username: this.signInForm.value.email,
        password: this.signInForm.value.password,
      };

      // Debug log - Request payload
      console.log('Login request payload:', loginData);

      this.authService
        .login(loginData)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            console.log('Request completed, loading state set to false');
          })
        )
        .subscribe({
          next: (response) => {
            // Debug log - Success response
            console.log('Login response:', response);

            if (response.success) {
              console.log('Login successful, navigating to profile');
              // Navigate to profile page after successful login
              this.router.navigate(['/profile']);
            } else {
              console.log('Login failed with message:', response.message);
              this.errorMessage = response.message || 'Login failed';
            }
          },
          error: (error) => {
            // Debug log - Error details
            console.error('Login error details:', {
              status: error.status,
              statusText: error.statusText,
              error: error.error,
              message: error.message,
              fullError: error,
            });

            if (error.error?.message) {
              this.errorMessage = error.error.message;
            } else if (typeof error.error === 'string') {
              this.errorMessage = error.error;
            } else {
              this.errorMessage =
                'An error occurred during login. Please try again.';
            }
          },
        });
    } else {
      console.log('Form validation failed', this.signInForm.errors);
      console.log('Form values:', this.signInForm.value);
      console.log('Form controls state:', {
        email: {
          valid: this.signInForm.get('email')?.valid,
          errors: this.signInForm.get('email')?.errors,
        },
        password: {
          valid: this.signInForm.get('password')?.valid,
          errors: this.signInForm.get('password')?.errors,
        },
      });

      // Mark all fields as touched to trigger validation messages
      Object.keys(this.signInForm.controls).forEach((key) => {
        const control = this.signInForm.get(key);
        control?.markAsTouched();
        control?.updateValueAndValidity();
      });
    }
  }

  signUp() {
    this.router.navigate(['/sign-up']);
  }
}
