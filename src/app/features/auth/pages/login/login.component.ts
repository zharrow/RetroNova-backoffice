import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, RippleModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Retro Nova - Back Office</h2>
        <h3>Connexion</h3>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" pInputText formControlName="email" 
                  [ngClass]="{'ng-dirty': loginForm.get('email')?.touched && loginForm.get('email')?.invalid}" />
            <small *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.hasError('required')" 
                  class="p-error">Email requis.</small>
            <small *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.hasError('email')" 
                  class="p-error">Email invalide.</small>
          </div>
          
          <div class="field">
            <label for="password">Mot de passe</label>
            <input id="password" type="password" pInputText formControlName="password" 
                  [ngClass]="{'ng-dirty': loginForm.get('password')?.touched && loginForm.get('password')?.invalid}" />
            <small *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.hasError('required')" 
                  class="p-error">Mot de passe requis.</small>
            <small *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.hasError('minlength')" 
                  class="p-error">Le mot de passe doit contenir au moins 6 caractères.</small>
          </div>
          
          <div class="field">
            <button pButton pRipple type="submit" label="Se connecter" 
                   [disabled]="loginForm.invalid || isLoading" 
                   [loading]="isLoading"></button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: var(--surface-ground);
    }
    
    .login-card {
      width: 90%;
      max-width: 400px;
      padding: 2rem;
      background-color: var(--surface-card);
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .login-card h2, .login-card h3 {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .field {
      margin-bottom: 1.5rem;
    }
    
    .field label {
      display: block;
      margin-bottom: 0.5rem;
    }
    
    .field input {
      width: 100%;
    }
    
    .field button {
      width: 100%;
      margin-top: 1rem;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  
  ngOnInit(): void {
    this.authService.isAuthenticated().subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.router.navigate(['/']);
      }
    });
  }
  
  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    const { email, password } = this.loginForm.value;
    
    this.authService.login(email, password).subscribe({
      next: () => {
        this.notificationService.showSuccess('Connexion réussie');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.notificationService.showError('Échec de la connexion. Vérifiez vos identifiants.');
        this.isLoading = false;
      }
    });
  }
}