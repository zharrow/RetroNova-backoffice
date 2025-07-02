// src/app/features/dashboard/pages/home/home.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { forkJoin } from 'rxjs';
import { ArcadesService } from '../../../../core/services/arcades.service';
import { GamesService } from '../../../../core/services/games.service';
import { UsersService } from '../../../../core/services/users.service';
import { PartiesService } from '../../../../core/services/parties.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

interface DashboardCard {
  title: string;
  icon: string;
  value: number;
  link: string;
  linkText: string;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule],
  template: `
    <div class="dashboard-container">
      <h1>Tableau de bord</h1>
      
      @if (isLoading()) {
        <div class="loading-container">
          <!-- <app-loader size="large"></app-loader> -->
        </div>
      }
      
      <!-- @if (!isLoading()) {
        <div class="dashboard-cards">
          @for (card of dashboardCards(); track card.title) {
            <p-card styleClass="dashboard-card">
              <ng-template pTemplate="header">
                <div class="card-header" [style.background-color]="card.color">
                  <i [class]="'pi ' + card.icon"></i>
                  <h3>{{ card.title }}</h3>
                </div>
              </ng-template>
              <div class="card-body">
                <h2>{{ card.value }}</h2>
                <a [routerLink]="card.link">{{ card.linkText }}</a>
              </div>
            </p-card>
          }
        </div>
      } -->
    </div>
  `,
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  // private readonly arcadesService = inject(ArcadesService);
  // private readonly gamesService = inject(GamesService);
  // private readonly usersService = inject(UsersService);
  // private readonly partiesService = inject(PartiesService);
  // private readonly promosService = inject(PromosService);

  readonly isLoading = signal(true);
  readonly dashboardCards = signal<DashboardCard[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Charge les données du tableau de bord
   */
  private loadDashboardData(): void {
    this.isLoading.set(true);
    
    forkJoin({
      // users: this.usersService.getAllUsers(),
      // machines: this.arcadesService.getAllArcades(),
      // games: this.gamesService.getAllGames(),
      // activeParties: this.partiesService.getActiveParties()
    }).subscribe({
      next: (data) => {
        this.updateDashboardCards(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Met à jour les cartes du tableau de bord
   */
  private updateDashboardCards(data: any): void {
    const cards: DashboardCard[] = [
      {
        title: 'Utilisateurs',
        icon: 'pi-users',
        value: data.users.length,
        link: '/users',
        linkText: 'Voir les utilisateurs',
        color: 'var(--primary-color)'
      },
      {
        title: 'Bornes d\'arcade',
        icon: 'pi-desktop',
        value: data.machines.length,
        link: '/arcade-machines',
        linkText: 'Gérer les bornes',
        color: 'var(--green-500)'
      },
      {
        title: 'Jeux',
        icon: 'pi-play',
        value: data.games.length,
        link: '/games',
        linkText: 'Voir les jeux',
        color: 'var(--yellow-500)'
      },
      {
        title: 'Parties en cours',
        icon: 'pi-ticket',
        value: data.activeParties.length,
        link: '/parties',
        linkText: 'Voir les parties',
        color: 'var(--red-500)'
      }
    ];
    
    this.dashboardCards.set(cards);
  }
}