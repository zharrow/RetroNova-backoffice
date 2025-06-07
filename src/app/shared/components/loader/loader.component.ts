// src/app/shared/components/loader/loader.component.ts

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    <div class="loader-container" [class.fullscreen]="fullScreen()">
      <p-progressSpinner 
        [style]="{width: spinnerSize(), height: spinnerSize()}"
        strokeWidth="4"
        animationDuration=".8s">
      </p-progressSpinner>
      @if (message()) {
        <p class="loader-message">{{ message() }}</p>
      }
    </div>
  `,
  styles: [`
    .loader-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      gap: 1rem;
    }
    
    .loader-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.4);
      z-index: 9999;
      backdrop-filter: blur(2px);
      animation: fadeIn 0.2s ease-out;
    }
    
    .loader-message {
      margin: 0;
      color: var(--text-color-secondary);
      font-size: 0.875rem;
      text-align: center;
      animation: pulse 2s infinite;
    }
    
    .fullscreen .loader-message {
      color: white;
      font-size: 1rem;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `]
})
export class LoaderComponent {
  readonly size = input<'small' | 'medium' | 'large'>('medium');
  readonly fullScreen = input<boolean>(false);
  readonly message = input<string>('');
  
  spinnerSize(): string {
    const sizes = {
      small: '2rem',
      medium: '3rem',
      large: '4rem'
    };
    return sizes[this.size()];
  }
}