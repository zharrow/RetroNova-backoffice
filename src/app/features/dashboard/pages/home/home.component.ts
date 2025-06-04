import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { forkJoin } from 'rxjs';
import { ArcadeMachinesService } from '../../../../core/services/arcade-machines.service';
import { GamesService } from '../../../../core/services/games.service';
import { UsersService } from '../../../../core/services/users.service';
import { PartiesService } from '../../../../core/services/parties.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, LoaderComponent],
  template: `
    <div class="dashboard-container">
      <h1>Tableau de bord</h1>
      
      @if (isLoading) {
        <p-card styleClass="dashboard-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <i class="pi pi-spinner pi-spin"></i>
              <h3>Chargement...</h3>
            </div>
          </ng-template>
          <app-loader></app-loader>
        </p-card>
      }
      <!-- <app-loader *ngIf="isLoading"></app-loader> -->
      
      <div *ngIf="!isLoading" class="dashboard-cards">
        <p-card styleClass="dashboard-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <i class="pi pi-users"></i>
              <h3>Utilisateurs</h3>
            </div>
          </ng-template>
          <h2>{{ totalUsers }}</h2>
          <a routerLink="/users">Voir les utilisateurs</a>
        </p-card>
        
        <p-card styleClass="dashboard-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <i class="pi pi-desktop"></i>
              <h3>Bornes d'arcade</h3>
            </div>
          </ng-template>
          <h2>{{ totalMachines }}</h2>
          <a routerLink="/arcade-machines">Gérer les bornes</a>
        </p-card>
        
        <p-card styleClass="dashboard-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <i class="pi pi-play"></i>
              <h3>Jeux</h3>
            </div>
          </ng-template>
          <h2>{{ totalGames }}</h2>
          <a routerLink="/games">Voir les jeux</a>
        </p-card>
        
        <p-card styleClass="dashboard-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <i class="pi pi-ticket"></i>
              <h3>Parties en cours</h3>
            </div>
          </ng-template>
          <h2>{{ activeParties }}</h2>
          <a routerLink="/parties">Voir les parties</a>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container h1 {
      margin-bottom: 2rem;
    }
    
    .dashboard-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    
    ::ng-deep .dashboard-card .p-card-body {
      padding: 1.5rem;
      text-align: center;
    }
    
    ::ng-deep .card-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: center;
      padding: 1rem;
      background-color: var(--surface-section);
    }
    
    ::ng-deep .card-header i {
      font-size: 1.5rem;
    }
    
    ::ng-deep .card-header h3 {
      margin: 0;
    }
    
    h2 {
      font-size: 2.5rem;
      margin: 1rem 0;
    }
    
    a {
      display: inline-block;
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
    }
    
    a:hover {
      text-decoration: underline;
    }
  `]
})
export class HomeComponent implements OnInit {
  totalUsers = 0;
  totalMachines = 0;
  totalGames = 0;
  activeParties = 0;
  isLoading = true;
  
  constructor(
    private arcadeMachinesService: ArcadeMachinesService,
    private gamesService: GamesService,
    private usersService: UsersService,
    private partiesService: PartiesService
  ) {}
  
  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  loadDashboardData(): void {
    this.isLoading = true;
    
    forkJoin({
      users: this.usersService.getAllUsers(),
      machines: this.arcadeMachinesService.getAllMachines(),
      games: this.gamesService.getAllGames(),
      activeParties: this.partiesService.getActiveParties()
    }).subscribe({
      next: (data) => {
        this.totalUsers = data.users.length;
        this.totalMachines = data.machines.length;
        this.totalGames = data.games.length;
        this.activeParties = data.activeParties.length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
      }
    });
  }
}