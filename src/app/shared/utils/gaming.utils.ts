// src/app/shared/utils/gaming.utils.ts

/**
 * Utilitaires spécifiques au gaming et aux bornes d'arcade
 */
export class GamingUtils {
  
  // === SLOT MANAGEMENT ===
  static getSlotStatusClass(hasGame: boolean): string {
    return hasGame ? 'slot-occupied' : 'slot-empty';
  }
  
  static getSlotStatusLabel(hasGame: boolean): string {
    return hasGame ? 'Occupé' : 'Libre';
  }
  
  static getSlotIcon(hasGame: boolean): string {
    return hasGame ? 'pi-check' : 'pi-plus';
  }

  // === MACHINE STATUS ===
  static getMachineStatusClass(status: string): string {
    return `machine-icon status-${status}`;
  }
  
  static getMachineStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    const severities: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      'active': 'success',
      'maintenance': 'warning',
      'inactive': 'danger',
      'partial': 'info'
    };
    return severities[status] || 'info';
  }
  
  static getMachineStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'active': 'pi-check-circle',
      'maintenance': 'pi-wrench',
      'inactive': 'pi-times-circle',
      'partial': 'pi-info-circle'
    };
    return icons[status] || 'pi-circle';
  }

  // === GAME CATEGORIES ===
  static getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'fighting': 'pi-users',
      'arcade': 'pi-star',
      'puzzle': 'pi-th-large',
      'racing': 'pi-car',
      'shooting': 'pi-target',
      'platform': 'pi-up',
      'retro': 'pi-history'
    };
    return icons[category.toLowerCase()] || 'pi-gamepad';
  }
  
  static getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'fighting': 'var(--arcade-red)',
      'arcade': 'var(--neon-blue)',
      'puzzle': 'var(--neon-purple)',
      'racing': 'var(--neon-orange)',
      'shooting': 'var(--neon-pink)',
      'platform': 'var(--neon-green)',
      'retro': 'var(--retro-yellow)'
    };
    return colors[category.toLowerCase()] || 'var(--gray-400)';
  }

  // === ANIMATIONS ===
  static getRandomAnimationDelay(index: number, maxDelay: number = 0.5): string {
    return `${(index * 0.1) % maxDelay}s`;
  }
  
  static getStaggerDelay(index: number, baseDelay: number = 0.1): string {
    return `${index * baseDelay}s`;
  }

  // === EFFECTS ===
  static shouldShowGamingEffects(): boolean {
    // Vérifier les préférences utilisateur et les capacités du navigateur
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  static getRandomNeonColor(): string {
    const neonColors = [
      'var(--neon-blue)',
      'var(--neon-purple)',
      'var(--neon-pink)',
      'var(--neon-green)',
      'var(--neon-orange)'
    ];
    return neonColors[Math.floor(Math.random() * neonColors.length)];
  }
}

// Exemple d'utilisation dans un composant :

/*
import { Component } from '@angular/core';
import { TemplateUtils, GamingUtils } from '../shared/utils';

@Component({
  selector: 'app-example',
  template: `
    <div>{{ utils.round(machine.utilization_rate) }}%</div>
    <div>{{ utils.formatCurrency(revenue) }}</div>
    <div [style.color]="gamingUtils.getCategoryColor(game.category)">
      <i [class]="'pi ' + gamingUtils.getCategoryIcon(game.category)"></i>
      {{ game.category }}
    </div>
  `
})
export class ExampleComponent {
  protected readonly utils = TemplateUtils;
  protected readonly gamingUtils = GamingUtils;
  
  // ... rest of component
}
*/