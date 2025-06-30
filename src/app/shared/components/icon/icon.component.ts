// src/app/shared/components/icon/icon.component.ts

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Mapping des icônes PrimeNG vers Font Awesome
 */
const ICON_MAPPING: Record<string, string> = {
  // Navigation & UI
  'pi-home': 'fas fa-home',
  'pi-desktop': 'fas fa-desktop',
  'pi-play': 'fas fa-gamepad',
  'pi-users': 'fas fa-users',
  'pi-user': 'fas fa-user',
  'pi-ticket': 'fas fa-ticket',
  'pi-chart-bar': 'fas fa-chart-bar',
  'pi-sign-out': 'fas fa-sign-out-alt',
  'pi-arrow-left': 'fas fa-arrow-left',
  'pi-plus': 'fas fa-plus',
  'pi-search': 'fas fa-search',
  'pi-eye': 'fas fa-eye',
  'pi-pencil': 'fas fa-pencil',
  'pi-trash': 'fas fa-trash',
  'pi-refresh': 'fas fa-sync',
  'pi-info-circle': 'fas fa-info-circle',
  'pi-check': 'fas fa-check',
  'pi-times': 'fas fa-times',
  'pi-exclamation-triangle': 'fas fa-exclamation-triangle',
  'pi-arrow-up': 'fas fa-arrow-up',
  'pi-arrow-down': 'fas fa-arrow-down',
  'pi-arrow-right': 'fas fa-arrow-right',
  'pi-minus': 'fas fa-minus',
  'pi-percentage': 'fas fa-percent',
  'pi-times-circle': 'fas fa-times-circle',
  'pi-trophy': 'fas fa-trophy',
  'pi-play-circle': 'fas fa-play-circle',
  'pi-check-circle': 'fas fa-check-circle',
  'pi-list': 'fas fa-list',
  'pi-sort': 'fas fa-sort',
  'pi-sort-up': 'fas fa-sort-up',
  'pi-sort-down': 'fas fa-sort-down',
  'pi-calendar': 'fas fa-calendar',
  'pi-clock': 'fas fa-clock',
  'pi-spin': 'fas fa-spinner fa-spin',
  'pi-cog': 'fas fa-cog',
  'pi-bell': 'fas fa-bell',
  'pi-envelope': 'fas fa-envelope',
  'pi-star': 'fas fa-star',
  'pi-star-fill': 'fas fa-star',
  'pi-shield': 'fas fa-shield-alt',
  'pi-lock': 'fas fa-lock',
  'pi-unlock': 'fas fa-unlock',
  'pi-filter': 'fas fa-filter',
  'pi-download': 'fas fa-download',
  'pi-upload': 'fas fa-upload',
  'pi-file': 'fas fa-file',
  'pi-folder': 'fas fa-folder',
  'pi-database': 'fas fa-database',
  'pi-server': 'fas fa-server',
  'pi-globe': 'fas fa-globe',
  'pi-link': 'fas fa-link',
  'pi-external-link': 'fas fa-external-link-alt',
  'pi-copy': 'fas fa-copy',
  'pi-print': 'fas fa-print',
  'pi-save': 'fas fa-save',
  'pi-question-circle': 'fas fa-question-circle',
  'pi-ban': 'fas fa-ban',
  'pi-power-off': 'fas fa-power-off',
  'pi-sync': 'fas fa-sync',
  'pi-history': 'fas fa-history',
  'pi-replay': 'fas fa-redo',
  'pi-heart': 'fas fa-heart',
  'pi-heart-fill': 'fas fa-heart',
  'pi-bookmark': 'fas fa-bookmark',
  'pi-tag': 'fas fa-tag',
  'pi-tags': 'fas fa-tags',
  'pi-comment': 'fas fa-comment',
  'pi-comments': 'fas fa-comments',
  'pi-share-alt': 'fas fa-share-alt',
  'pi-send': 'fas fa-paper-plane',
  'pi-moon': 'fas fa-moon',
  'pi-sun': 'fas fa-sun',
  'pi-video': 'fas fa-video',
  'pi-camera': 'fas fa-camera',
  'pi-image': 'fas fa-image',
  'pi-volume-up': 'fas fa-volume-up',
  'pi-volume-down': 'fas fa-volume-down',
  'pi-volume-off': 'fas fa-volume-mute',
  'pi-wifi': 'fas fa-wifi',
  'pi-phone': 'fas fa-phone',
  'pi-mobile': 'fas fa-mobile-alt',
  'pi-inbox': 'fas fa-inbox',
  'pi-map-marker': 'fas fa-map-marker-alt',
  'pi-directions': 'fas fa-directions',
  'pi-compass': 'fas fa-compass',
  'pi-credit-card': 'fas fa-credit-card',
  'pi-dollar': 'fas fa-dollar-sign',
  'pi-wallet': 'fas fa-wallet',
  'pi-shopping-cart': 'fas fa-shopping-cart',
  'pi-shopping-bag': 'fas fa-shopping-bag',
  'pi-gift': 'fas fa-gift',
  'pi-truck': 'fas fa-truck',
  'pi-palette': 'fas fa-palette',
  'pi-sliders-h': 'fas fa-sliders-h',
  'pi-sliders-v': 'fas fa-sliders-h',
  'pi-code': 'fas fa-code',
  'pi-terminal': 'fas fa-terminal',
  'pi-bug': 'fas fa-bug',
  'pi-github': 'fab fa-github',
  'pi-linkedin': 'fab fa-linkedin',
  'pi-twitter': 'fab fa-twitter',
  'pi-facebook': 'fab fa-facebook',
  'pi-google': 'fab fa-google',
  'pi-apple': 'fab fa-apple',
  'pi-microsoft': 'fab fa-microsoft',
  'pi-android': 'fab fa-android',
  'pi-slack': 'fab fa-slack',
  'pi-discord': 'fab fa-discord',
  'pi-whatsapp': 'fab fa-whatsapp',
  'pi-telegram': 'fab fa-telegram',
  'pi-youtube': 'fab fa-youtube',
  'pi-instagram': 'fab fa-instagram',
  'pi-reddit': 'fab fa-reddit',
  'pi-twitch': 'fab fa-twitch',
  'pi-paypal': 'fab fa-paypal',
  'pi-amazon': 'fab fa-amazon',
  'pi-spotify': 'fab fa-spotify',
  'pi-window-maximize': 'fas fa-window-maximize',
  'pi-window-minimize': 'fas fa-window-minimize',
  'pi-bars': 'fas fa-bars',
  'pi-ellipsis-v': 'fas fa-ellipsis-v',
  'pi-ellipsis-h': 'fas fa-ellipsis-h',
  'pi-angle-up': 'fas fa-angle-up',
  'pi-angle-down': 'fas fa-angle-down',
  'pi-angle-left': 'fas fa-angle-left',
  'pi-angle-right': 'fas fa-angle-right',
  'pi-angle-double-up': 'fas fa-angle-double-up',
  'pi-angle-double-down': 'fas fa-angle-double-down',
  'pi-angle-double-left': 'fas fa-angle-double-left',
  'pi-angle-double-right': 'fas fa-angle-double-right',
  'pi-chevron-up': 'fas fa-chevron-up',
  'pi-chevron-down': 'fas fa-chevron-down',
  'pi-chevron-left': 'fas fa-chevron-left',
  'pi-chevron-right': 'fas fa-chevron-right',
  'pi-caret-up': 'fas fa-caret-up',
  'pi-caret-down': 'fas fa-caret-down',
  'pi-caret-left': 'fas fa-caret-left',
  'pi-caret-right': 'fas fa-caret-right',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <i [class]="iconClass()" 
       [style.font-size]="size()" 
       [style.color]="color()"
       [attr.aria-label]="label()">
    </i>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    i {
      line-height: 1;
      transition: all 0.2s ease;
    }
  `]
})
export class IconComponent {
  readonly icon = input.required<string>();
  readonly size = input<string>('');
  readonly color = input<string>('');
  readonly label = input<string>('');
  readonly spin = input<boolean>(false);
  
  /**
   * Calcule la classe d'icône appropriée
   */
  iconClass(): string {
    const iconName = this.icon();
    let mappedIcon = ICON_MAPPING[iconName] || iconName;
    
    // Si l'icône n'est pas dans le mapping et commence par 'pi-', 
    // on essaie de la convertir automatiquement
    if (!ICON_MAPPING[iconName] && iconName.startsWith('pi-')) {
      const cleanName = iconName.replace('pi-', '');
      mappedIcon = `fas fa-${cleanName}`;
    }
    
    // Si c'est déjà une classe Font Awesome, on la garde
    if (iconName.includes('fa-')) {
      mappedIcon = iconName;
    }
    
    // Ajouter la classe spin si nécessaire
    if (this.spin()) {
      mappedIcon += ' fa-spin';
    }
    
    return mappedIcon;
  }
}