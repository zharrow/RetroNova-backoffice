// src/app/shared/components/header/header.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonModule, RippleModule, RouterLink],
  template: `
    <div class="header-container">
      <div class="logo">
        <a [routerLink]="'/'">
          <h1>Retro Nova - Back Office</h1>
        </a>
      </div>
      <div class="user-info">
        <span>{{ userName() }}</span>
        <button pButton pRipple type="button" icon="pi pi-sign-out" 
                class="p-button-rounded p-button-text" 
                (click)="logout()"
                [loading]="isLoggingOut()"></button>
      </div>
    </div>
  `,
  styles: [`
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1rem;
      height: 60px;
      background-color: var(--surface-card);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .logo a {
      text-decoration: none;
      color: var(--text-color);
    }
    
    .logo h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .user-info span {
      font-weight: 500;
      color: var(--text-color);
    }
  `]
})
export class HeaderComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  readonly userName = signal<string>('');
  readonly isLoggingOut = signal(false);

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName.set(user.first_name || user.firebase_id);
    }
  }

  logout(): void {
    this.isLoggingOut.set(true);
    
    this.authService.logout().subscribe({
      next: () => {
        this.notificationService.showSuccess('Déconnexion réussie');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.notificationService.showError('Erreur lors de la déconnexion');
        console.error('Logout error:', error);
        this.isLoggingOut.set(false);
      }
    });
  }
}