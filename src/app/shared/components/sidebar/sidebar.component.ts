// src/app/shared/components/sidebar/sidebar.component.ts

import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { filter } from 'rxjs/operators';

/**
 * Interface définissant la structure d'un élément de menu
 */
interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly routerLink: string;
  readonly badge?: number;
  readonly children?: readonly MenuItem[];
}

/**
 * Interface pour l'état du composant sidebar
 */
interface SidebarState {
  readonly isCollapsed: boolean;
  readonly activeRoute: string;
  readonly hoveredItem: string | null;
}

/**
 * Composant sidebar moderne avec navigation responsive
 * Utilise les signals d'Angular 19 pour la gestion d'état
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RippleModule, TooltipModule],
  template: `
    <aside [class]="sidebarClasses()">
      <!-- Header avec logo -->
      <div class="sidebar-header">
        @if (!state().isCollapsed) {
          <div class="logo animate-fade-in">
            <i class="pi pi-gamepad-2 logo-icon"></i>
            <span class="logo-text arcade-title">Retro Nova</span>
          </div>
        } @else {
          <div class="logo-collapsed animate-scale-in">
            <i class="pi pi-gamepad-2 logo-icon neon-text"></i>
          </div>
        }
        
        <!-- Toggle button -->
        <button 
          class="toggle-btn arcade-button"
          (click)="toggleSidebar()"
          pRipple
          [pTooltip]="state().isCollapsed ? 'Développer' : 'Réduire'"
          tooltipPosition="right">
          <i [class]="toggleIconClass()"></i>
        </button>
      </div>

      <!-- Navigation menu -->
      <nav class="sidebar-nav">
        <ul class="menu-list stagger-fade-in">
          @for (item of menuItems(); track item.id) {
            <li class="menu-item">
              <a 
                [routerLink]="item.routerLink"
                [class]="getMenuItemClass(item)"
                (mouseenter)="setHoveredItem(item.id)"
                (mouseleave)="setHoveredItem(null)"
                pRipple
                [pTooltip]="state().isCollapsed ? item.label : ''"
                tooltipPosition="right">
                
                <div class="menu-icon-container">
                  <i [class]="'pi ' + item.icon + ' menu-icon'"></i>
                  @if (item.badge && item.badge > 0) {
                    <span class="menu-badge animate-pulse">{{ item.badge }}</span>
                  }
                </div>
                
                @if (!state().isCollapsed) {
                  <span class="menu-label">{{ item.label }}</span>
                  @if (isActiveRoute(item.routerLink)) {
                    <span class="active-indicator"></span>
                  }
                }
              </a>
            </li>
          }
        </ul>
      </nav>

      <!-- Footer avec informations utilisateur -->
      <div class="sidebar-footer">
        @if (!state().isCollapsed) {
          <div class="user-info animate-fade-in">
            <div class="user-avatar status-online">
              <i class="pi pi-user"></i>
            </div>
            <div class="user-details">
              <span class="user-name">Admin</span>
              <span class="user-role">Gestionnaire</span>
            </div>
          </div>
        } @else {
          <div class="user-avatar-collapsed status-online">
            <i class="pi pi-user"></i>
          </div>
        }
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      @apply fixed left-0 top-0 h-full flex flex-col;
      background: linear-gradient(180deg, var(--surface-card) 0%, var(--surface-section) 100%);
      border-right: 1px solid var(--surface-border);
      box-shadow: var(--shadow-lg);
      transition: all var(--transition-normal);
      z-index: var(--z-fixed);
      width: 280px;
      
      &.collapsed {
        width: 80px;
      }
      
      &.mobile-hidden {
        transform: translateX(-100%);
      }
    }

    .sidebar-header {
      @apply flex items-center justify-between p-4 border-b;
      border-color: var(--surface-border);
      min-height: 80px;
      
      .logo {
        @apply flex items-center gap-3;
        
        .logo-icon {
          font-size: 2rem;
          color: var(--neon-blue);
        }
        
        .logo-text {
          font-size: 1.25rem;
          font-weight: 800;
        }
      }
      
      .logo-collapsed {
        @apply flex items-center justify-center;
        width: 48px;
        height: 48px;
        
        .logo-icon {
          font-size: 1.5rem;
        }
      }
      
      .toggle-btn {
        @apply flex items-center justify-center rounded-lg border-0;
        width: 40px;
        height: 40px;
        background: var(--surface-ground);
        color: var(--text-color-secondary);
        cursor: pointer;
        transition: all var(--transition-fast);
        
        &:hover {
          background: var(--gaming-gradient-primary);
          color: white;
          transform: scale(1.05);
        }
        
        i {
          font-size: 1rem;
          transition: transform var(--transition-fast);
        }
      }
    }

    .sidebar-nav {
      @apply flex-1 overflow-y-auto py-4;
      
      .menu-list {
        @apply list-none p-0 m-0;
        
        .menu-item {
          @apply mb-1;
          
          a {
            @apply flex items-center gap-3 py-3 px-4 mx-2 rounded-lg;
            color: var(--text-color-secondary);
            text-decoration: none;
            transition: all var(--transition-fast);
            position: relative;
            overflow: hidden;
            
            &:hover {
              background: var(--surface-hover);
              color: var(--text-color);
              transform: translateX(4px);
            }
            
            &.active {
              background: var(--gaming-gradient-primary);
              color: white;
              box-shadow: var(--shadow-glow);
              
              .menu-icon {
                color: white;
              }
            }
            
            .menu-icon-container {
              @apply relative flex items-center justify-center;
              width: 24px;
              height: 24px;
              
              .menu-icon {
                font-size: 1.25rem;
                transition: all var(--transition-fast);
              }
              
              .menu-badge {
                @apply absolute -top-1 -right-1 flex items-center justify-center;
                background: var(--arcade-red);
                color: white;
                border-radius: var(--radius-full);
                font-size: 0.625rem;
                font-weight: 600;
                min-width: 16px;
                height: 16px;
                padding: 0 4px;
              }
            }
            
            .menu-label {
              @apply font-medium;
              white-space: nowrap;
            }
            
            .active-indicator {
              @apply absolute right-3;
              width: 6px;
              height: 6px;
              background: white;
              border-radius: 50%;
              animation: pulse 2s infinite;
            }
          }
        }
      }
    }

    .sidebar-footer {
      @apply p-4 border-t;
      border-color: var(--surface-border);
      
      .user-info {
        @apply flex items-center gap-3;
        
        .user-avatar {
          @apply flex items-center justify-center rounded-full;
          width: 40px;
          height: 40px;
          background: var(--gaming-gradient-primary);
          color: white;
          position: relative;
          
          i {
            font-size: 1.25rem;
          }
        }
        
        .user-details {
          @apply flex flex-col;
          
          .user-name {
            @apply font-medium text-sm;
            color: var(--text-color);
          }
          
          .user-role {
            @apply text-xs;
            color: var(--text-color-secondary);
          }
        }
      }
      
      .user-avatar-collapsed {
        @apply flex items-center justify-center rounded-full mx-auto;
        width: 40px;
        height: 40px;
        background: var(--gaming-gradient-primary);
        color: white;
        position: relative;
        
        i {
          font-size: 1.25rem;
        }
      }
    }

    // Responsive design
    @media (max-width: 768px) {
      .sidebar {
        &:not(.mobile-hidden) {
          width: 100vw;
          max-width: 280px;
        }
      }
    }
  `]
})
export class SidebarComponent {
  private readonly router = inject(Router);

  /**
   * État du composant géré par des signals
   */
  protected readonly state = signal<SidebarState>({
    isCollapsed: false,
    activeRoute: '',
    hoveredItem: null
  });

  /**
   * Liste des éléments de menu avec badges dynamiques
   */
  protected readonly menuItems = signal<readonly MenuItem[]>([
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: 'pi-home',
      routerLink: '/'
    },
    {
      id: 'arcade-machines',
      label: 'Bornes d\'arcade',
      icon: 'pi-desktop',
      routerLink: '/arcade-machines',
      badge: 0
    },
    {
      id: 'games',
      label: 'Jeux',
      icon: 'pi-play',
      routerLink: '/games'
    },
    {
      id: 'users',
      label: 'Utilisateurs',
      icon: 'pi-users',
      routerLink: '/users'
    },
    {
      id: 'parties',
      label: 'Parties',
      icon: 'pi-ticket',
      routerLink: '/parties',
      badge: 0
    },
    {
      id: 'statistics',
      label: 'Statistiques',
      icon: 'pi-chart-bar',
      routerLink: '/statistics'
    }
  ]);

  /**
   * Classes CSS calculées pour la sidebar
   */
  protected readonly sidebarClasses = computed(() => {
    const state = this.state();
    return [
      'sidebar',
      state.isCollapsed && 'collapsed'
    ].filter(Boolean).join(' ');
  });

  /**
   * Classe d'icône pour le bouton toggle
   */
  protected readonly toggleIconClass = computed(() => {
    return this.state().isCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left';
  });

  constructor() {
    this.initializeRouterSubscription();
    this.initializeKeyboardShortcuts();
  }

  /**
   * Initialise l'écoute des changements de route
   */
  private initializeRouterSubscription(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveRoute(event.url);
      });
  }

  /**
   * Initialise les raccourcis clavier
   */
  private initializeKeyboardShortcuts(): void {
    effect(() => {
      const handleKeyboard = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.key === 'b') {
          event.preventDefault();
          this.toggleSidebar();
        }
      };

      document.addEventListener('keydown', handleKeyboard);
      return () => document.removeEventListener('keydown', handleKeyboard);
    });
  }

  /**
   * Met à jour la route active
   */
  private updateActiveRoute(url: string): void {
    this.state.update(current => ({
      ...current,
      activeRoute: url
    }));
  }

  /**
   * Toggle l'état de la sidebar
   */
  protected toggleSidebar(): void {
    this.state.update(current => ({
      ...current,
      isCollapsed: !current.isCollapsed
    }));
  }

  /**
   * Définit l'élément survolé
   */
  protected setHoveredItem(itemId: string | null): void {
    this.state.update(current => ({
      ...current,
      hoveredItem: itemId
    }));
  }

  /**
   * Vérifie si une route est active
   */
  protected isActiveRoute(routerLink: string): boolean {
    const currentRoute = this.state().activeRoute;
    return routerLink === '/' 
      ? currentRoute === '/' 
      : currentRoute.startsWith(routerLink);
  }

  /**
   * Retourne les classes CSS pour un élément de menu
   */
  protected getMenuItemClass(item: MenuItem): string {
    const classes = ['menu-link'];
    
    if (this.isActiveRoute(item.routerLink)) {
      classes.push('active');
    }
    
    if (this.state().hoveredItem === item.id) {
      classes.push('hovered');
    }
    
    return classes.join(' ');
  }

  /**
   * Met à jour le badge d'un élément de menu
   */
  public updateMenuBadge(itemId: string, count: number): void {
    this.menuItems.update(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, badge: count }
          : item
      )
    );
  }
}