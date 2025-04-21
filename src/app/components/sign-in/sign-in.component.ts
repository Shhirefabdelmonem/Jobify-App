import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LogInDTO } from '../../services/auth.service';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {
  signInForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    }, { updateOn: 'blur' });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  signInWithGoogle() {
    // Implement Google sign-in logic
    console.log('Sign in with Google clicked');
  }

  onSubmit() {
    if (this.signInForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const loginData: LogInDTO = {
        username: this.signInForm.value.email,
        password: this.signInForm.value.password
      };
      
      // Debug log - Request payload
      console.log('Login request payload:', loginData);
      
      this.authService.login(loginData)
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
              fullError: error
            });
            
            if (error.error?.message) {
              this.errorMessage = error.error.message;
            } else if (typeof error.error === 'string') {
              this.errorMessage = error.error;
            } else {
              this.errorMessage = 'An error occurred during login. Please try again.';
            }
          }
        });
    } else {
      console.log('Form validation failed', this.signInForm.errors);
      console.log('Form values:', this.signInForm.value);
      console.log('Form controls state:', {
        email: {
          valid: this.signInForm.get('email')?.valid,
          errors: this.signInForm.get('email')?.errors
        },
        password: {
          valid: this.signInForm.get('password')?.valid,
          errors: this.signInForm.get('password')?.errors
        }
      });
      
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.signInForm.controls).forEach(key => {
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

