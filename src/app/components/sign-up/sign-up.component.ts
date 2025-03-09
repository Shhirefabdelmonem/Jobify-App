import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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
  
  constructor(
    private fb: FormBuilder,
    private router: Router
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
      console.log('Form submitted', this.signUpForm.value);
      // Implement your sign-up logic here
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
