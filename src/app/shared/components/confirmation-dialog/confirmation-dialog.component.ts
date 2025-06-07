// src/app/shared/components/confirmation-dialog/confirmation-dialog.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule, RippleModule],
  template: `
    <div class="confirmation-dialog">
      <div class="dialog-icon">
        <i class="pi pi-exclamation-triangle"></i>
      </div>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="confirmation-actions">
        <button pButton pRipple type="button" 
                label="Annuler" 
                class="p-button-outlined p-button-secondary" 
                (click)="cancel()"></button>
        <button pButton pRipple type="button" 
                label="Confirmer" 
                class="p-button-danger" 
                (click)="confirm()"></button>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      padding: 1rem;
      text-align: center;
    }
    
    .dialog-icon {
      margin-bottom: 1rem;
      
      i {
        font-size: 3rem;
        color: var(--yellow-500);
      }
    }
    
    h2 {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
      color: var(--text-color);
    }
    
    p {
      margin: 0 0 2rem 0;
      color: var(--text-color-secondary);
      line-height: 1.5;
    }
    
    .confirmation-actions {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
    }
  `]
})
export class ConfirmationDialogComponent {
  private readonly ref = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);
  
  readonly title = this.config.data?.title || 'Confirmation';
  readonly message = this.config.data?.message || 'Êtes-vous sûr ?';
  
  confirm(): void {
    this.ref.close(true);
  }
  
  cancel(): void {
    this.ref.close(false);
  }
}