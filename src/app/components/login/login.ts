import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { LoginRequest } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule  // ← ADD THIS
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  submitted = false;
  isLoading = false;
  errorMessage: string = '';
  successMessage: string = '';
  showPassword = false;
  returnUrl: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/search';

    this.initializeForm();
  }

  initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched || this.submitted));
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;

    const loginRequest: LoginRequest = {
      email: this.loginForm.value.email.trim(),
      password: this.loginForm.value.password
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        console.log('Login successful');
        this.isLoading = false;
        this.successMessage = 'Login successful! Redirecting...';
        
        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 1000);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isLoading = false;
        this.errorMessage = error.message || 'Invalid email or password. Please try again.';
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  demoLogin(): void {
    this.loginForm.patchValue({
      email: 'admin@filmexplorer.com',
      password: 'password123'
    });
  }
}