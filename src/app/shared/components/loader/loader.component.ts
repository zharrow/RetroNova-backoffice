// src/app/shared/components/loader/loader.component.ts

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-container" [class.fullscreen]="fullScreen()">
      <div class="loader-content">
        <i class="fas fa-spinner fa-spin loader-icon" [style.font-size]="spinnerSize()"></i>
        @if (message()) {
          <p class="loader-message">{{ message() }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .loader-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 2rem;
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
    }
    
    .loader-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    
    .loader-icon {
      color: var(--primary-color);
    }
    
    .fullscreen .loader-icon {
      color: white;
    }
    
    .loader-message {
      margin: 0;
      color: var(--text-color-secondary);
      font-size: 0.875rem;
      text-align: center;
    }
    
    .fullscreen .loader-message {
      color: white;
      font-size: 1rem;
    }
  `]
})
export class LoaderComponent {
  readonly size = input<'small' | 'medium' | 'large'>('medium');
  readonly fullScreen = input<boolean>(false);
  readonly message = input<string>('');
  
  spinnerSize(): string {
    const sizes = {
      small: '1.5rem',
      medium: '2.5rem',
      large: '3.5rem'
    };
    return sizes[this.size()];
  }
}