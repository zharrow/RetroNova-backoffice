// src/app/shared/components/sidebar/sidebar.component.ts

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ArcadeMachinesService } from '../../../core/services/arcade-machines.service';

interface MenuItem {
  label: string;
  icon: string;
  routerLink: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="sidebar">
      <ul class="menu-list">
        @for (item of menuItems(); track item.routerLink) {
          <li [routerLinkActive]="'active'">
            <a [routerLink]="item.routerLink">
              <i class="menu-icon" [ngClass]="item.icon"></i>
              <span class="menu-label">{{ item.label }}</span>
              @if (item.badge) {
                <span class="menu-badge">{{ item.badge }}</span>
              }
            </a>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      min-height: calc(100vh - 60px);
      background-color: var(--surface-section);
      padding: 1rem 0;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(0);
      }
    }
    
    .menu-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .menu-list li {
      margin-bottom: 0.25rem;
    }
    
    .menu-list li a {
      display: flex;
      align-items: center;
      padding: 0.75rem 1.25rem;
      text-decoration: none;
      color: var(--text-color);
      transition: all 0.2s;
      position: relative;
    }
    
    .menu-list li a:hover {
      background-color: var(--surface-hover);
      padding-left: 1.5rem;
    }
    
    .menu-list li a .menu-icon {
      margin-right: 0.75rem;
      font-size: 1.2rem;
      width: 24px;
      text-align: center;
    }
    
    .menu-list li a .menu-label {
      flex: 1;
    }
    
    .menu-list li a .menu-badge {
      background-color: var(--primary-color);
      color: white;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-weight: 600;
    }
    
    .menu-list li.active a {
      background-color: var(--primary-color);
      color: var(--primary-color-text);
      font-weight: 600;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background-color: white;
        opacity: 0.5;
      }
    }
    
    .menu-list li.active a .menu-badge {
      background-color: white;
      color: var(--primary-color);
    }
  `]
})
export class SidebarComponent {
  readonly menuItems = signal<MenuItem[]>([
    { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/' },
    { label: 'Bornes d\'arcade', icon: 'pi pi-desktop', routerLink: '/arcade-machines' },
    { label: 'Jeux', icon: 'pi pi-play', routerLink: '/games' },
    { label: 'Utilisateurs', icon: 'pi pi-users', routerLink: '/users' },
    { label: 'Parties', icon: 'pi pi-ticket', routerLink: '/parties' },
    { label: 'Statistiques', icon: 'pi pi-chart-bar', routerLink: '/statistics' }
  ]);
}