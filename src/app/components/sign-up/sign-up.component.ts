import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterDTO } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
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
    this.signUpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8)
      ]],
      receiveUpdates: [true]
    }, { updateOn: 'blur' });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  signUpWithGoogle() {
    // Implement Google sign-up logic
    console.log('Sign up with Google clicked');
  }

  onSubmit() {
    if (this.signUpForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const registerData: RegisterDTO = {
        username: this.signUpForm.value.email,
        password: this.signUpForm.value.password
      };
      
      // Debug log - Request payload
      console.log('Registration request payload:', registerData);
      
      this.authService.register(registerData)
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
              console.log('Registration failed with message:', response.message);
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
              fullError: error
            });
            
            if (error.error?.message) {
              this.errorMessage = error.error.message;
            } else if (typeof error.error === 'string') {
              this.errorMessage = error.error;
            } else {
              this.errorMessage = 'An error occurred during registration. Please try again.';
            }
          }
        });
    } else {
      console.log('Form validation failed', this.signUpForm.errors);
      console.log('Form values:', this.signUpForm.value);
      console.log('Form controls state:', {
        email: {
          valid: this.signUpForm.get('email')?.valid,
          errors: this.signUpForm.get('email')?.errors
        },
        password: {
          valid: this.signUpForm.get('password')?.valid,
          errors: this.signUpForm.get('password')?.errors
        }
      });
      
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.signUpForm.controls).forEach(key => {
        const control = this.signUpForm.get(key);
        control?.markAsTouched();
        control?.updateValueAndValidity();
      });
    }
  }

  signIn() {
    this.router.navigate(['/signin']);
  }
}
