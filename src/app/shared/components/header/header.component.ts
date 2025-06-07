// src/app/shared/components/header/header.component.ts

import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * Interface pour l'état du header
 */
interface HeaderState {
  readonly userName: string;
  readonly userAvatar?: string;
  readonly notificationCount: number;
  readonly isSearchVisible: boolean;
  readonly currentTime: string;
}

/**
 * Interface pour une notification
 */
interface Notification {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly type: 'info' | 'success' | 'warning' | 'error';
  readonly timestamp: Date;
  readonly read: boolean;
}

/**
 * Composant header moderne avec notifications et gestion utilisateur
 * Utilise les nouveautés Angular 19
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    ButtonModule, 
    RippleModule, 
    MenuModule, 
    BadgeModule, 
    AvatarModule
  ],
  template: `
    <header class="app-header">
      <div class="header-container">
        <!-- Section gauche: Breadcrumb -->
        <div class="header-left">
          <div class="breadcrumb">
            <i class="pi pi-home breadcrumb-icon"></i>
            @for (segment of breadcrumbSegments(); track segment.label) {
              <span class="breadcrumb-separator">/</span>
              <span [class]="getBreadcrumbClass(segment)">
                {{ segment.label }}
              </span>
            }
          </div>
        </div>

        <!-- Section centre: Recherche -->
        <div class="header-center">
          @if (state().isSearchVisible) {
            <div class="search-container animate-scale-in">
              <i class="pi pi-search search-icon"></i>
              <input 
                type="text"
                placeholder="Rechercher..."
                class="search-input"
                (keydown.escape)="toggleSearch()"
                #searchInput />
              <button 
                class="search-close"
                (click)="toggleSearch()"
                pRipple>
                <i class="pi pi-times"></i>
              </button>
            </div>
          }
        </div>

        <!-- Section droite: Actions et utilisateur -->
        <div class="header-right">
          <!-- Recherche toggle -->
          <button 
            class="action-btn"
            (click)="toggleSearch()"
            pRipple
            pTooltip="Rechercher (Ctrl+K)"
            tooltipPosition="bottom">
            <i class="pi pi-search"></i>
          </button>

          <!-- Notifications -->
          <div class="notification-container">
            <button 
              class="action-btn"
              (click)="toggleNotifications()"
              pRipple
              pTooltip="Notifications"
              tooltipPosition="bottom">
              <i class="pi pi-bell"></i>
              @if (state().notificationCount > 0) {
                <p-badge 
                  [value]="state().notificationCount.toString()" 
                  severity="danger" 
                  styleClass="notification-badge animate-pulse">
                </p-badge>
              }
            </button>

            <!-- Panel notifications -->
            @if (showNotifications()) {
              <div class="notifications-panel animate-fade-in">
                <div class="notifications-header">
                  <h3>Notifications</h3>
                  <button 
                    class="clear-all-btn"
                    (click)="clearAllNotifications()"
                    pRipple>
                    Tout effacer
                  </button>
                </div>
                
                <div class="notifications-list">
                  @if (recentNotifications().length === 0) {
                    <div class="no-notifications">
                      <i class="pi pi-bell-slash"></i>
                      <span>Aucune notification</span>
                    </div>
                  } @else {
                    @for (notification of recentNotifications(); track notification.id) {
                      <div [class]="getNotificationClass(notification)">
                        <div class="notification-icon">
                          <i [class]="getNotificationIcon(notification.type)"></i>
                        </div>
                        <div class="notification-content">
                          <h4>{{ notification.title }}</h4>
                          <p>{{ notification.message }}</p>
                          <span class="notification-time">
                            {{ formatTime(notification.timestamp) }}
                          </span>
                        </div>
                        <button 
                          class="notification-close"
                          (click)="dismissNotification(notification.id)"
                          pRipple>
                          <i class="pi pi-times"></i>
                        </button>
                      </div>
                    }
                  }
                </div>
              </div>
            }
          </div>

          <!-- Theme toggle -->
          <button 
            class="action-btn"
            (click)="toggleTheme()"
            pRipple
            [pTooltip]="themeTooltip()"
            tooltipPosition="bottom">
            <i [class]="themeIcon()"></i>
          </button>

          <!-- Horloge -->
          <div class="clock">
            <span class="time">{{ state().currentTime }}</span>
          </div>

          <!-- Menu utilisateur -->
          <div class="user-menu">
            <button 
              class="user-button"
              (click)="menu.toggle($event)"
              pRipple>
              <p-avatar 
                [label]="userInitials()" 
                styleClass="user-avatar"
                [style]="{ 'background-color': 'var(--gaming-gradient-primary)' }">
              </p-avatar>
              <div class="user-info">
                <span class="user-name">{{ state().userName }}</span>
                <span class="user-role">Administrateur</span>
              </div>
              <i class="pi pi-chevron-down user-chevron"></i>
            </button>

            <p-menu 
              #menu 
              [model]="userMenuItems()" 
              [popup]="true"
              styleClass="user-dropdown">
            </p-menu>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      @apply fixed top-0 right-0 z-10;
      left: 280px;
      height: 70px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--surface-border);
      transition: all var(--transition-normal);
      
      .header-container {
        @apply h-full flex items-center justify-between px-6;
        
        .header-left {
          @apply flex items-center;
          
          .breadcrumb {
            @apply flex items-center gap-2 text-sm;
            color: var(--text-color-secondary);
            
            .breadcrumb-icon {
              color: var(--primary-500);
            }
            
            .breadcrumb-separator {
              color: var(--text-color-muted);
            }
            
            .breadcrumb-current {
              color: var(--text-color);
              font-weight: 500;
            }
          }
        }
        
        .header-center {
          @apply flex-1 flex justify-center;
          max-width: 500px;
          
          .search-container {
            @apply relative flex items-center w-full;
            
            .search-icon {
              @apply absolute left-3;
              color: var(--text-color-secondary);
            }
            
            .search-input {
              @apply w-full pl-10 pr-10 py-2 rounded-lg border-0;
              background: var(--surface-ground);
              color: var(--text-color);
              font-size: 0.875rem;
              
              &:focus {
                outline: none;
                box-shadow: 0 0 0 2px var(--primary-500);
              }
              
              &::placeholder {
                color: var(--text-color-muted);
              }
            }
            
            .search-close {
              @apply absolute right-2 p-1 rounded border-0;
              background: transparent;
              color: var(--text-color-secondary);
              cursor: pointer;
              
              &:hover {
                background: var(--surface-hover);
              }
            }
          }
        }
        
        .header-right {
          @apply flex items-center gap-4;
          
          .action-btn {
            @apply relative flex items-center justify-center rounded-lg border-0;
            width: 40px;
            height: 40px;
            background: transparent;
            color: var(--text-color-secondary);
            cursor: pointer;
            transition: all var(--transition-fast);
            
            &:hover {
              background: var(--surface-hover);
              color: var(--text-color);
              transform: scale(1.05);
            }
            
            i {
              font-size: 1.125rem;
            }
          }
          
          .notification-container {
            @apply relative;
            
            .notification-badge {
              @apply absolute -top-1 -right-1;
            }
            
            .notifications-panel {
              @apply absolute top-12 right-0 w-80;
              background: var(--surface-card);
              border: 1px solid var(--surface-border);
              border-radius: var(--radius-lg);
              box-shadow: var(--shadow-xl);
              z-index: var(--z-dropdown);
              
              .notifications-header {
                @apply flex items-center justify-between p-4 border-b;
                border-color: var(--surface-border);
                
                h3 {
                  @apply m-0 font-semibold;
                }
                
                .clear-all-btn {
                  @apply text-sm border-0 rounded px-3 py-1;
                  background: var(--surface-ground);
                  color: var(--text-color-secondary);
                  cursor: pointer;
                  
                  &:hover {
                    background: var(--surface-hover);
                  }
                }
              }
              
              .notifications-list {
                @apply max-h-80 overflow-y-auto;
                
                .no-notifications {
                  @apply flex flex-col items-center justify-center py-8 gap-2;
                  color: var(--text-color-muted);
                  
                  i {
                    font-size: 2rem;
                  }
                }
                
                .notification-item {
                  @apply flex items-start gap-3 p-4 border-b;
                  border-color: var(--surface-border);
                  transition: background var(--transition-fast);
                  
                  &:hover {
                    background: var(--surface-hover);
                  }
                  
                  &.unread {
                    background: rgba(59, 130, 246, 0.05);
                    border-left: 3px solid var(--primary-500);
                  }
                  
                  .notification-icon {
                    @apply flex items-center justify-center rounded-full;
                    width: 32px;
                    height: 32px;
                    
                    &.info { background: var(--blue-100); color: var(--blue-600); }
                    &.success { background: var(--green-100); color: var(--green-600); }
                    &.warning { background: var(--yellow-100); color: var(--yellow-600); }
                    &.error { background: var(--red-100); color: var(--red-600); }
                  }
                  
                  .notification-content {
                    @apply flex-1;
                    
                    h4 {
                      @apply m-0 text-sm font-medium mb-1;
                    }
                    
                    p {
                      @apply m-0 text-sm mb-2;
                      color: var(--text-color-secondary);
                    }
                    
                    .notification-time {
                      @apply text-xs;
                      color: var(--text-color-muted);
                    }
                  }
                  
                  .notification-close {
                    @apply p-1 rounded border-0;
                    background: transparent;
                    color: var(--text-color-muted);
                    cursor: pointer;
                    
                    &:hover {
                      background: var(--surface-hover);
                    }
                  }
                }
              }
            }
          }
          
          .clock {
            @apply px-3 py-2 rounded-lg;
            background: var(--surface-ground);
            border: 1px solid var(--surface-border);
            
            .time {
              @apply text-sm font-mono font-medium;
              color: var(--text-color);
            }
          }
          
          .user-menu {
            @apply relative;
            
            .user-button {
              @apply flex items-center gap-3 px-3 py-2 rounded-lg border-0;
              background: transparent;
              cursor: pointer;
              transition: all var(--transition-fast);
              
              &:hover {
                background: var(--surface-hover);
              }
              
              .user-info {
                @apply flex flex-col items-start;
                
                .user-name {
                  @apply text-sm font-medium;
                  color: var(--text-color);
                }
                
                .user-role {
                  @apply text-xs;
                  color: var(--text-color-secondary);
                }
              }
              
              .user-chevron {
                @apply text-xs;
                color: var(--text-color-secondary);
                transition: transform var(--transition-fast);
              }
              
              &[aria-expanded="true"] .user-chevron {
                transform: rotate(180deg);
              }
            }
          }
        }
      }
    }

    // Mode sombre
    [data-theme="dark"] .app-header {
      background: rgba(30, 41, 59, 0.8);
    }

    // Responsive
    @media (max-width: 768px) {
      .app-header {
        left: 80px;
        
        .header-container {
          @apply px-4;
          
          .header-center {
            @apply hidden;
          }
          
          .user-info {
            @apply hidden;
          }
        }
      }
    }
  `]
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly themeService = inject(ThemeService);

  /**
   * État du header
   */
  protected readonly state = signal<HeaderState>({
    userName: 'Admin User',
    notificationCount: 0,
    isSearchVisible: false,
    currentTime: ''
  });

  /**
   * Affichage du panel de notifications
   */
  protected readonly showNotifications = signal(false);

  /**
   * Notifications récentes
   */
  protected readonly recentNotifications = signal<readonly Notification[]>([]);

  /**
   * Segments de breadcrumb calculés
   */
  protected readonly breadcrumbSegments = computed(() => {
    const url = this.router.url;
    const segments = url.split('/').filter(segment => segment);
    
    return segments.map((segment, index) => ({
      label: this.formatSegmentLabel(segment),
      isLast: index === segments.length - 1
    }));
  });

  /**
   * Initiales de l'utilisateur
   */
  protected readonly userInitials = computed(() => {
    return this.state().userName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();
  });

  /**
   * Icône du thème
   */
  protected readonly themeIcon = computed(() => {
    const theme = this.themeService.effectiveTheme();
    return theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon';
  });

  /**
   * Tooltip du thème
   */
  protected readonly themeTooltip = computed(() => {
    const theme = this.themeService.effectiveTheme();
    return theme === 'dark' ? 'Mode clair' : 'Mode sombre';
  });

  /**
   * Éléments du menu utilisateur
   */
  protected readonly userMenuItems = computed((): MenuItem[] => [
    {
      label: 'Mon profil',
      icon: 'pi pi-user',
      command: () => this.navigateToProfile()
    },
    {
      label: 'Paramètres',
      icon: 'pi pi-cog',
      command: () => this.navigateToSettings()
    },
    { separator: true },
    {
      label: 'Se déconnecter',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }
  ]);

  constructor() {
    this.initializeClock();
    this.loadNotifications();
  }

  /**
   * Initialise l'horloge
   */
  private initializeClock(): void {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      this.state.update(current => ({
        ...current,
        currentTime: time
      }));
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  /**
   * Charge les notifications
   */
  private loadNotifications(): void {
    // Simulation de notifications
    this.recentNotifications.set([
      {
        id: '1',
        title: 'Nouvelle partie terminée',
        message: 'Une partie sur Borne Rétro 1 vient de se terminer',
        type: 'info',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        title: 'Maintenance programmée',
        message: 'Maintenance de la borne 3 prévue demain à 14h',
        type: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: false
      }
    ]);

    this.updateNotificationCount();
  }

  /**
   * Met à jour le compteur de notifications
   */
  private updateNotificationCount(): void {
    const unreadCount = this.recentNotifications()
      .filter(n => !n.read).length;
    
    this.state.update(current => ({
      ...current,
      notificationCount: unreadCount
    }));
  }

  /**
   * Formate un segment de breadcrumb
   */
  private formatSegmentLabel(segment: string): string {
    const labels: Record<string, string> = {
      'arcade-machines': 'Bornes d\'arcade',
      'games': 'Jeux',
      'users': 'Utilisateurs',
      'parties': 'Parties',
      'statistics': 'Statistiques'
    };
    
    return labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  /**
   * Toggle la recherche
   */
  protected toggleSearch(): void {
    this.state.update(current => ({
      ...current,
      isSearchVisible: !current.isSearchVisible
    }));
  }

  /**
   * Toggle les notifications
   */
  protected toggleNotifications(): void {
    this.showNotifications.update(current => !current);
  }

  /**
   * Efface toutes les notifications
   */
  protected clearAllNotifications(): void {
    this.recentNotifications.set([]);
    this.updateNotificationCount();
    this.showNotifications.set(false);
  }

  /**
   * Rejette une notification
   */
  protected dismissNotification(id: string): void {
    this.recentNotifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
    this.updateNotificationCount();
  }

  /**
   * Toggle le thème
   */
  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Retourne les classes CSS pour le breadcrumb
   */
  protected getBreadcrumbClass(segment: any): string {
    return segment.isLast ? 'breadcrumb-current' : '';
  }

  /**
   * Retourne les classes CSS pour une notification
   */
  protected getNotificationClass(notification: Notification): string {
    const classes = ['notification-item'];
    if (!notification.read) classes.push('unread');
    return classes.join(' ');
  }

  /**
   * Retourne l'icône pour un type de notification
   */
  protected getNotificationIcon(type: string): string {
    const icons = {
      info: 'pi pi-info-circle',
      success: 'pi pi-check-circle',
      warning: 'pi pi-exclamation-triangle',
      error: 'pi pi-times-circle'
    };
    return icons[type as keyof typeof icons] || 'pi pi-info-circle';
  }

  /**
   * Formate le temps d'une notification
   */
  protected formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    
    return timestamp.toLocaleDateString('fr-FR');
  }

  /**
   * Navigue vers le profil
   */
  private navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Navigue vers les paramètres
   */
  private navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  /**
   * Déconnexion
   */
  private logout(): void {
    this.authService.logout();
  }
}