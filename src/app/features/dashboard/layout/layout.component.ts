import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="layout-container">
      <app-header></app-header>
      <div class="main-container">
        <app-sidebar></app-sidebar>
        <div class="content-container">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    .main-container {
      display: flex;
      flex: 1;
    }
    
    .content-container {
      flex: 1;
      padding: 1.5rem;
      background-color: var(--surface-ground);
      overflow-y: auto;
    }
  `]
})
export class LayoutComponent {}