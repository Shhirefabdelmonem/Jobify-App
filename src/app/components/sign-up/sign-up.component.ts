import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterDTO } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
})
export class SignUpComponent {
  signUpForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.signUpForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        receiveUpdates: [true],
      },
      { updateOn: 'blur' }
    );
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  signUpWithGoogle() {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Starting Google Sign-Up...');

    this.authService
      .signUpWithGoogle()
      .then(() => {
        console.log('Google sign-up completed successfully');
      })
      .catch((error) => {
        console.error('Google sign-up error details:', error);

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
          this.errorMessage = 'Google Sign-Up timed out. Please try again.';
        } else if (
          error.message?.includes('closed') ||
          error.message?.includes('cancelled') ||
          error.message?.includes('dismissed')
        ) {
          this.errorMessage = 'Sign-up was cancelled. Please try again.';
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
            'Failed to sign up with Google. Please try again or use email/password.';
        }
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  onSubmit() {
    if (this.signUpForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const registerData: RegisterDTO = {
        username: this.signUpForm.value.email,
        password: this.signUpForm.value.password,
      };

      // Debug log - Request payload
      console.log('Registration request payload:', registerData);

      this.authService
        .register(registerData)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            console.log('Request completed, loading state set to false');
          })
        )
        .subscribe({
          next: (response) => {
            // Debug log - Success response
            console.log('Registration response:', response);

            if (response.success) {
              console.log('Registration successful, navigating to profile');
              // Navigate to profile page after successful registration
              this.router.navigate(['/profile']);
            } else {
              console.log(
                'Registration failed with message:',
                response.message
              );
              this.errorMessage = response.message || 'Registration failed';
            }
          },
          error: (error) => {
            // Debug log - Error details
            console.error('Registration error details:', {
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
                'An error occurred during registration. Please try again.';
            }
          },
        });
    } else {
      console.log('Form validation failed', this.signUpForm.errors);
      console.log('Form values:', this.signUpForm.value);
      console.log('Form controls state:', {
        email: {
          valid: this.signUpForm.get('email')?.valid,
          errors: this.signUpForm.get('email')?.errors,
        },
        password: {
          valid: this.signUpForm.get('password')?.valid,
          errors: this.signUpForm.get('password')?.errors,
        },
      });

      // Mark all fields as touched to trigger validation messages
      Object.keys(this.signUpForm.controls).forEach((key) => {
        const control = this.signUpForm.get(key);
        control?.markAsTouched();
        control?.updateValueAndValidity();
      });
    }
  }

  signIn() {
    this.router.navigate(['/sign-in']);
  }
}
