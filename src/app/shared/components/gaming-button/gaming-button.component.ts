import { Component, input, output } from '@angular/core';

// Classe abstraite pour les variantes
abstract class ButtonVariant {
  abstract getClasses(): string[];
  abstract getAnimationClass(): string;
}

class PrimaryButtonVariant extends ButtonVariant {
  getClasses(): string[] {
    return ['btn-primary', 'neon-glow'];
  }
  
  getAnimationClass(): string {
    return 'pulse-primary';
  }
}

class ArcadeButtonVariant extends ButtonVariant {
  getClasses(): string[] {
    return ['btn-arcade', 'retro-border', 'pixel-text'];
  }
  
  getAnimationClass(): string {
    return 'arcade-press';
  }
}

@Component({
  selector: 'app-gaming-button',
  standalone: true,
  template: `
    <button 
      [class]="buttonClasses()"
      [disabled]="disabled()"
      (click)="handleClick()">
      <span class="btn-content">
        @if (loading()) {
          <i class="pi pi-spin pi-spinner"></i>
        } @else if (icon()) {
          <i [class]="'pi pi-' + icon()"></i>
        }
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    
    button {
      position: relative;
      padding: var(--space-3) var(--space-6);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: all var(--transition-normal);
      cursor: pointer;
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .btn-primary {
      background: var(--gaming-gradient-primary);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
    }
    
    .btn-arcade {
      background: transparent;
      color: var(--neon-blue);
      border: 2px solid currentColor;
      
      &:hover {
        background: var(--neon-blue);
        color: black;
        transform: scale(1.05);
      }
    }
    
    @keyframes arcade-press {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(0.95); }
    }
  `]
})
export class GamingButtonComponent {
  // Inputs avec signals
  readonly variant = input<'primary' | 'arcade'>('primary');
  readonly icon = input<string>();
  readonly loading = input(false);
  readonly disabled = input(false);
  
  // Output avec signal
  readonly clicked = output<void>();
  
  // Polymorphisme avec factory
  private getVariant(): ButtonVariant {
    const variants = {
      primary: new PrimaryButtonVariant(),
      arcade: new ArcadeButtonVariant()
    };
    
    return variants[this.variant()];
  }
  
  buttonClasses(): string {
    const variant = this.getVariant();
    return [
      'gaming-button',
      ...variant.getClasses(),
      this.loading() ? 'is-loading' : ''
    ].join(' ');
  }
  
  handleClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}