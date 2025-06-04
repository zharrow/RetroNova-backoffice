import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  routerLink: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="sidebar">
      <ul class="menu-list">
        <li *ngFor="let item of menuItems" [routerLinkActive]="'active'">
          <a [routerLink]="item.routerLink">
            <i class="menu-icon" [ngClass]="item.icon"></i>
            <span class="menu-label">{{ item.label }}</span>
          </a>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      min-height: calc(100vh - 60px);
      background-color: var(--surface-section);
      padding: 1rem 0;
    }
    
    .menu-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .menu-list li {
      margin-bottom: 0.5rem;
    }
    
    .menu-list li a {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: var(--text-color);
      transition: background-color 0.2s;
    }
    
    .menu-list li a:hover {
      background-color: var(--surface-hover);
    }
    
    .menu-list li a .menu-icon {
      margin-right: 0.75rem;
      font-size: 1.2rem;
    }
    
    .menu-list li.active a {
      background-color: var(--primary-color);
      color: var(--primary-color-text);
      font-weight: 600;
    }
  `]
})
export class SidebarComponent {
  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/' },
    { label: 'Bornes d\'arcade', icon: 'pi pi-desktop', routerLink: '/arcade-machines' },
    { label: 'Jeux', icon: 'pi pi-play', routerLink: '/games' },
    { label: 'Utilisateurs', icon: 'pi pi-users', routerLink: '/users' },
    { label: 'Parties', icon: 'pi pi-ticket', routerLink: '/parties' },
    { label: 'Statistiques', icon: 'pi pi-chart-bar', routerLink: '/statistics' }
  ];
}