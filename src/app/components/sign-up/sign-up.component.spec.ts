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
      password: ['', [Validators.required, Validators.minLength(8)]],
      receiveUpdates: [true]
    });
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
      
      this.authService.register(registerData)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              console.log('Registration successful');
              // Navigate to dashboard or home page after successful registration
              this.router.navigate(['/dashboard']);
            } else {
              this.errorMessage = response.message || 'Registration failed';
            }
          },
          error: (error) => {
            console.error('Registration error:', error);
            this.errorMessage = error.error?.message || 'An error occurred during registration. Please try again.';
          }
        });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.signUpForm.controls).forEach(key => {
        this.signUpForm.get(key)?.markAsTouched();
      });
    }
  }

  signIn() {
    this.router.navigate(['/signin']);
  }
}