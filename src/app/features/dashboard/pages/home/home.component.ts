// src/app/features/dashboard/pages/home/home.component.ts

import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

import { StatsCardComponent } from '../../../../shared/components/stats-card/stats-card.component';
import { ArcadeMachinesService } from '../../../../core/services/arcade-machines.service';
import { GamesService } from '../../../../core/services/games.service';
import { UsersService } from '../../../../core/services/users.service';
import { PartiesService } from '../../../../core/services/parties.service';

/**
 * Interface pour les données du dashboard
 */
interface DashboardData {
  readonly totalUsers: number;
  readonly totalMachines: number;
  readonly totalGames: number;
  readonly activeParties: number;
  readonly todayRevenue: number;
  readonly weeklyGrowth: number;
}

/**
 * Interface pour les activités récentes
 */
interface RecentActivity {
  readonly id: string;
  readonly type: 'game_started' | 'game_ended' | 'user_registered' | 'machine_maintenance';
  readonly title: string;
  readonly description: string;
  readonly timestamp: Date;
  readonly user?: string;
  readonly machine?: string;
}

/**
 * Interface pour les bornes populaires
 */
interface PopularMachine {
  readonly id: string;
  readonly name: string;
  readonly usage: number;
  readonly revenue: number;
  readonly status: 'online' | 'offline' | 'maintenance';
}

/**
 * Interface pour les données de graphique
 */
interface ChartData {
  readonly labels: string[];
  readonly datasets: {
    readonly label: string;
    readonly data: number[];
    readonly backgroundColor?: string | string[];
    readonly borderColor?: string;
    readonly tension?: number;
  }[];
}

/**
 * Composant dashboard moderne avec widgets temps réel
 * Utilise les signals d'Angular 19 pour la gestion d'état réactive
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ChartModule,
    ButtonModule,
    RippleModule,
    TableModule,
    TagModule,
    ProgressBarModule,
    AvatarModule,
    TooltipModule,
    StatsCardComponent
  ],
  template: `
    <div class="dashboard-container animate-fade-in">
      <!-- Header avec salutation -->
      <div class="dashboard-header">
        <div class="welcome-section">
          <h1 class="welcome-title">
            {{ getGreeting() }}
            <span class="user-name neon-text">Admin</span>
          </h1>
          <p class="welcome-subtitle">
            Voici un aperçu de votre arcade aujourd'hui
          </p>
        </div>
        
        <div class="quick-actions">
          <button 
            pButton 
            pRipple 
            icon="pi pi-plus" 
            label="Nouvelle partie"
            class="p-button-success arcade-button"
            (click)="startNewGame()"
            pTooltip="Démarrer une nouvelle partie">
          </button>
          
          <button 
            pButton 
            pRipple 
            icon="pi pi-cog" 
            label="Maintenance"
            class="p-button-warning"
            (click)="openMaintenance()"
            pTooltip="Outils de maintenance">
          </button>
        </div>
      </div>

      <!-- Cartes de statistiques principales -->
      <div class="stats-overview stagger-fade-in">
        <app-stats-card
          [data]="{
            title: 'Utilisateurs actifs',
            value: dashboardData().totalUsers,
            icon: 'pi-users',
            color: 'primary',
            trend: { value: dashboardData().weeklyGrowth, direction: 'up', period: 'cette semaine' },
            loading: isLoading()
          }"
          [clickable]="true"
          [animated]="true"
          [gamingStyle]="true"
          (cardClick)="navigateToUsers()">
        </app-stats-card>

        <app-stats-card
          [data]="{
            title: 'Bornes actives',
            value: activeMachinesCount(),
            icon: 'pi-desktop',
            color: 'success',
            subtitle: 'sur ' + dashboardData().totalMachines + ' bornes',
            loading: isLoading()
          }"
          [clickable]="true"
          [gamingStyle]="true"
          (cardClick)="navigateToMachines()">
        </app-stats-card>

        <app-stats-card
          [data]="{
            title: 'Parties en cours',
            value: dashboardData().activeParties,
            icon: 'pi-play',
            color: 'warning',
            trend: { value: 15, direction: 'up', period: 'vs hier' },
            loading: isLoading()
          }"
          [clickable]="true"
          [animated]="true"
          (cardClick)="navigateToParties()">
        </app-stats-card>

        <app-stats-card
          [data]="{
            title: 'Revenus aujourd\\'hui',
            value: dashboardData().todayRevenue + '€',
            icon: 'pi-euro',
            color: 'info',
            trend: { value: 8, direction: 'up', period: 'vs hier' },
            loading: isLoading()
          }"
          [animated]="true">
        </app-stats-card>
      </div>

      <!-- Widgets principaux -->
      <div class="main-widgets">
        <!-- Graphique d'activité -->
        <div class="widget-card activity-chart gaming-card-glow">
          <div class="widget-header">
            <h2>Activité des dernières 24h</h2>
            <div class="chart-controls">
              <button 
                *ngFor="let period of chartPeriods"
                [class]="getChartButtonClass(period)"
                (click)="setChartPeriod(period)"
                pRipple>
                {{ period.label }}
              </button>
            </div>
          </div>
          
          <div class="chart-container">
            <p-chart 
              type="line" 
              [data]="activityChartData()" 
              [options]="chartOptions"
              [responsive]="true">
            </p-chart>
          </div>
        </div>

        <!-- Bornes populaires -->
        <div class="widget-card popular-machines gaming-card-glow">
          <div class="widget-header">
            <h2>Bornes populaires</h2>
            <button 
              pButton 
              pRipple 
              icon="pi pi-refresh"
              class="p-button-text p-button-sm"
              (click)="refreshMachinesData()"
              pTooltip="Actualiser">
            </button>
          </div>
          
          <div class="machines-list">
            @for (machine of popularMachines(); track machine.id) {
              <div class="machine-item hover-lift">
                <div class="machine-info">
                  <div class="machine-details">
                    <h4>{{ machine.name }}</h4>
                    <span class="machine-usage">{{ machine.usage }}% d'utilisation</span>
                  </div>
                  <p-tag 
                    [value]="getMachineStatusLabel(machine.status)"
                    [severity]="getMachineStatusSeverity(machine.status)"
                    [icon]="getMachineStatusIcon(machine.status)">
                  </p-tag>
                </div>
                
                <div class="machine-metrics">
                  <div class="metric">
                    <span class="metric-value">{{ machine.revenue }}€</span>
                    <span class="metric-label">Revenus</span>
                  </div>
                  <p-progressBar 
                    [value]="machine.usage" 
                    [showValue]="false"
                    [style]="{ height: '6px' }"
                    styleClass="machine-progress">
                  </p-progressBar>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Widgets secondaires -->
      <div class="secondary-widgets">
        <!-- Activités récentes -->
        <div class="widget-card recent-activity gaming-card-glow">
          <div class="widget-header">
            <h2>Activités récentes</h2>
            <span class="activity-count">{{ recentActivities().length }} aujourd'hui</span>
          </div>
          
          <div class="activities-list">
            @if (recentActivities().length === 0) {
              <div class="empty-activities">
                <i class="pi pi-history"></i>
                <span>Aucune activité récente</span>
              </div>
            } @else {
              @for (activity of recentActivities(); track activity.id) {
                <div class="activity-item animate-fade-in-left">
                  <div class="activity-icon">
                    <i [class]="getActivityIcon(activity.type)"></i>
                  </div>
                  <div class="activity-content">
                    <h4>{{ activity.title }}</h4>
                    <p>{{ activity.description }}</p>
                    <span class="activity-time">{{ getRelativeTime(activity.timestamp) }}</span>
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <!-- Jeux populaires -->
        <div class="widget-card popular-games gaming-card-glow">
          <div class="widget-header">
            <h2>Jeux populaires</h2>
            <button 
              pButton 
              pRipple 
              icon="pi pi-chart-pie"
              class="p-button-text p-button-sm"
              (click)="viewDetailedStats()"
              pTooltip="Voir les statistiques détaillées">
            </button>
          </div>
          
          <div class="games-chart">
            <p-chart 
              type="doughnut" 
              [data]="gamesChartData()" 
              [options]="doughnutOptions">
            </p-chart>
          </div>
        </div>

        <!-- Performances temps réel -->
        <div class="widget-card realtime-performance gaming-card-glow">
          <div class="widget-header">
            <h2>Performance temps réel</h2>
            <div class="live-indicator animate-pulse">
              <span class="live-dot"></span>
              <span>LIVE</span>
            </div>
          </div>
          
          <div class="performance-metrics">
            <div class="metric-row">
              <span class="metric-label">Parties/heure</span>
              <span class="metric-value">{{ realtimeMetrics().gamesPerHour }}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Temps moyen/partie</span>
              <span class="metric-value">{{ realtimeMetrics().avgGameTime }}min</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Revenus/heure</span>
              <span class="metric-value">{{ realtimeMetrics().revenuePerHour }}€</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Satisfaction</span>
              <div class="satisfaction-bar">
                <p-progressBar 
                  [value]="realtimeMetrics().satisfaction"
                  [showValue]="false"
                  styleClass="satisfaction-progress">
                </p-progressBar>
                <span class="satisfaction-value">{{ realtimeMetrics().satisfaction }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      @apply p-6 space-y-6;
      min-height: 100vh;
      background: var(--surface-ground);
    }

    .dashboard-header {
      @apply flex justify-between items-start;
      
      .welcome-section {
        .welcome-title {
          @apply text-3xl font-bold mb-2;
          margin: 0;
          
          .user-name {
            @apply ml-2;
          }
        }
        
        .welcome-subtitle {
          @apply text-lg;
          color: var(--text-color-secondary);
          margin: 0;
        }
      }
      
      .quick-actions {
        @apply flex gap-3;
      }
    }

    .stats-overview {
      @apply grid gap-6;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    .main-widgets {
      @apply grid gap-6;
      grid-template-columns: 2fr 1fr;
      
      @media (max-width: 1200px) {
        grid-template-columns: 1fr;
      }
    }

    .secondary-widgets {
      @apply grid gap-6;
      grid-template-columns: 1fr 1fr 1fr;
      
      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .widget-card {
      @apply rounded-xl p-6;
      
      .widget-header {
        @apply flex justify-between items-center mb-6;
        
        h2 {
          @apply text-xl font-semibold m-0;
          color: var(--text-color);
        }
        
        .chart-controls {
          @apply flex gap-2;
          
          button {
            @apply px-3 py-1 text-sm rounded border-0;
            background: var(--surface-section);
            color: var(--text-color-secondary);
            cursor: pointer;
            transition: all var(--transition-fast);
            
            &.active {
              background: var(--primary-500);
              color: white;
            }
            
            &:hover:not(.active) {
              background: var(--surface-hover);
            }
          }
        }
        
        .activity-count {
          @apply text-sm px-3 py-1 rounded-full;
          background: var(--surface-section);
          color: var(--text-color-secondary);
        }
        
        .live-indicator {
          @apply flex items-center gap-2 text-sm font-medium;
          color: var(--neon-green);
          
          .live-dot {
            @apply w-2 h-2 rounded-full;
            background: var(--neon-green);
          }
        }
      }
    }

    .activity-chart {
      .chart-container {
        height: 300px;
        
        :host ::ng-deep canvas {
          max-height: 300px;
        }
      }
    }

    .popular-machines {
      .machines-list {
        @apply space-y-4;
        
        .machine-item {
          @apply p-4 rounded-lg border;
          background: var(--surface-section);
          border-color: var(--surface-border);
          transition: all var(--transition-fast);
          
          .machine-info {
            @apply flex justify-between items-start mb-3;
            
            .machine-details {
              h4 {
                @apply text-base font-medium m-0 mb-1;
                color: var(--text-color);
              }
              
              .machine-usage {
                @apply text-sm;
                color: var(--text-color-secondary);
              }
            }
          }
          
          .machine-metrics {
            @apply space-y-2;
            
            .metric {
              @apply text-center;
              
              .metric-value {
                @apply block text-lg font-semibold;
                color: var(--text-color);
              }
              
              .metric-label {
                @apply block text-xs;
                color: var(--text-color-secondary);
              }
            }
            
            :host ::ng-deep .machine-progress {
              .p-progressbar-value {
                background: var(--gaming-gradient-primary);
              }
            }
          }
        }
      }
    }

    .recent-activity {
      .activities-list {
        @apply space-y-4 max-h-80 overflow-y-auto;
        
        .empty-activities {
          @apply flex flex-col items-center justify-center py-8 gap-2;
          color: var(--text-color-muted);
          
          i {
            font-size: 2rem;
          }
        }
        
        .activity-item {
          @apply flex gap-3 p-3 rounded-lg;
          background: var(--surface-section);
          
          .activity-icon {
            @apply flex items-center justify-center rounded-full;
            width: 32px;
            height: 32px;
            background: var(--primary-100);
            color: var(--primary-600);
            
            i {
              font-size: 0.875rem;
            }
          }
          
          .activity-content {
            @apply flex-1;
            
            h4 {
              @apply text-sm font-medium m-0 mb-1;
              color: var(--text-color);
            }
            
            p {
              @apply text-sm m-0 mb-1;
              color: var(--text-color-secondary);
            }
            
            .activity-time {
              @apply text-xs;
              color: var(--text-color-muted);
            }
          }
        }
      }
    }

    .popular-games {
      .games-chart {
        height: 250px;
        
        :host ::ng-deep canvas {
          max-height: 250px;
        }
      }
    }

    .realtime-performance {
      .performance-metrics {
        @apply space-y-4;
        
        .metric-row {
          @apply flex justify-between items-center;
          
          .metric-label {
            @apply text-sm;
            color: var(--text-color-secondary);
          }
          
          .metric-value {
            @apply text-base font-semibold;
            color: var(--text-color);
          }
          
          .satisfaction-bar {
            @apply flex items-center gap-2 flex-1 ml-4;
            
            :host ::ng-deep .satisfaction-progress {
              @apply flex-1;
              height: 8px;
              
              .p-progressbar-value {
                background: var(--neon-green);
              }
            }
            
            .satisfaction-value {
              @apply text-sm font-medium;
              color: var(--neon-green);
            }
          }
        }
      }
    }

    // Responsive design
    @media (max-width: 768px) {
      .dashboard-container {
        @apply p-4 space-y-4;
      }
      
      .dashboard-header {
        @apply flex-col gap-4;
      }
      
      .stats-overview {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent {
  // Services injectés
  private readonly arcadeMachinesService = inject(ArcadeMachinesService);
  private readonly gamesService = inject(GamesService);
  private readonly usersService = inject(UsersService);
  private readonly partiesService = inject(PartiesService);

  // État du composant
  protected readonly isLoading = signal(false);
  protected readonly selectedChartPeriod = signal('24h');

  // Données principales
  protected readonly dashboardData = signal<DashboardData>({
    totalUsers: 0,
    totalMachines: 0,
    totalGames: 0,
    activeParties: 0,
    todayRevenue: 0,
    weeklyGrowth: 0
  });

  protected readonly popularMachines = signal<readonly PopularMachine[]>([]);
  protected readonly recentActivities = signal<readonly RecentActivity[]>([]);
  protected readonly realtimeMetrics = signal({
    gamesPerHour: 0,
    avgGameTime: 0,
    revenuePerHour: 0,
    satisfaction: 95
  });

  // Périodes pour les graphiques
  protected readonly chartPeriods = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7j' },
    { value: '30d', label: '30j' }
  ];

  // Options pour les graphiques
  protected readonly chartOptions: any;
  protected readonly doughnutOptions: any;

  /**
   * Nombre de bornes actives calculé
   */
  protected readonly activeMachinesCount = computed(() => {
    return this.popularMachines().filter(m => m.status === 'online').length;
  });

  /**
   * Données du graphique d'activité
   */
  protected readonly activityChartData = computed((): ChartData => {
    const period = this.selectedChartPeriod();
    const labels = this.generateChartLabels(period);
    const data = this.generateChartData(period);
    
    return {
      labels,
      datasets: [{
        label: 'Parties jouées',
        data,
        borderColor: 'var(--neon-blue)',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        tension: 0.4
      }]
    };
  });

  /**
   * Données du graphique des jeux populaires
   */
  protected readonly gamesChartData = computed((): ChartData => {
    return {
      labels: ['Street Fighter', 'Pac-Man', 'Galaga', 'Donkey Kong', 'Autres'],
      datasets: [{
        label: 'Popularité',
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'var(--neon-blue)',
          'var(--neon-purple)',
          'var(--neon-pink)',
          'var(--neon-green)',
          'var(--neon-orange)'
        ]
      }]
    };
  });

  constructor() {
    this.initializeChartOptions();
    this.loadDashboardData();
    this.startRealtimeUpdates();
  }

  /**
   * Initialise les options des graphiques
   */
  private initializeChartOptions(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 2.5,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder, display: false }
        },
        y: {
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      hover: {
        intersect: false,
        mode: 'nearest'
      }
    };

    this.doughnutOptions = {
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        legend: {
          labels: { color: textColor },
          position: 'bottom'
        }
      }
    };
  }

  /**
   * Charge les données du dashboard
   */
  private async loadDashboardData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const [users, machines, games, activeParties] = await forkJoin({
        users: this.usersService.getAllUsers(),
        machines: this.arcadeMachinesService.getAllMachines(),
        games: this.gamesService.getAllGames(),
        activeParties: this.partiesService.getActiveParties()
      }).toPromise();

      this.dashboardData.set({
        totalUsers: users?.length || 0,
        totalMachines: machines?.length || 0,
        totalGames: games?.length || 0,
        activeParties: activeParties?.length || 0,
        todayRevenue: this.calculateTodayRevenue(),
        weeklyGrowth: 12
      });

      this.generateMockData();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Génère des données simulées pour la démo
   */
  private generateMockData(): void {
    // Bornes populaires
    this.popularMachines.set([
      {
        id: '1',
        name: 'Borne Rétro Zone 1',
        usage: 85,
        revenue: 245,
        status: 'online'
      },
      {
        id: '2',
        name: 'Borne Combat Arena',
        usage: 72,
        revenue: 189,
        status: 'online'
      },
      {
        id: '3',
        name: 'Borne Vintage Classic',
        usage: 45,
        revenue: 98,
        status: 'maintenance'
      }
    ]);

    // Activités récentes
    this.recentActivities.set([
      {
        id: '1',
        type: 'game_started',
        title: 'Nouvelle partie démarrée',
        description: 'Street Fighter II sur Borne Rétro Zone 1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        user: 'Player123'
      },
      {
        id: '2',
        type: 'user_registered',
        title: 'Nouvel utilisateur',
        description: 'GamerPro vient de s\'inscrire',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        user: 'GamerPro'
      },
      {
        id: '3',
        type: 'game_ended',
        title: 'Partie terminée',
        description: 'Pac-Man - Score record battu !',
        timestamp: new Date(Date.now() - 1000 * 60 * 30)
      }
    ]);
  }

  /**
   * Démarre les mises à jour temps réel
   */
  private startRealtimeUpdates(): void {
    interval(5000).pipe(
      takeWhile(() => true)
    ).subscribe(() => {
      this.updateRealtimeMetrics();
    });
  }

  /**
   * Met à jour les métriques temps réel
   */
  private updateRealtimeMetrics(): void {
    this.realtimeMetrics.update(current => ({
      ...current,
      gamesPerHour: Math.floor(Math.random() * 20) + 15,
      avgGameTime: Math.floor(Math.random() * 5) + 12,
      revenuePerHour: Math.floor(Math.random() * 50) + 75,
      satisfaction: Math.floor(Math.random() * 10) + 90
    }));
  }

  /**
   * Calcule les revenus d'aujourd'hui
   */
  private calculateTodayRevenue(): number {
    return Math.floor(Math.random() * 500) + 200;
  }

  /**
   * Génère les labels pour les graphiques
   */
  private generateChartLabels(period: string): string[] {
    switch (period) {
      case '24h':
        return Array.from({ length: 24 }, (_, i) => `${i}h`);
      case '7d':
        return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      case '30d':
        return Array.from({ length: 30 }, (_, i) => `${i + 1}`);
      default:
        return [];
    }
  }

  /**
   * Génère les données pour les graphiques
   */
  private generateChartData(period: string): number[] {
    const length = period === '24h' ? 24 : period === '7d' ? 7 : 30;
    return Array.from({ length }, () => Math.floor(Math.random() * 50) + 10);
  }

  // Méthodes d'interaction

  protected getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  protected setChartPeriod(period: typeof this.chartPeriods[0]): void {
    this.selectedChartPeriod.set(period.value);
  }

  protected getChartButtonClass(period: typeof this.chartPeriods[0]): string {
    return this.selectedChartPeriod() === period.value ? 'active' : '';
  }

  protected refreshMachinesData(): void {
    this.generateMockData();
  }

  protected getMachineStatusLabel(status: string): string {
    const labels = {
      online: 'En ligne',
      offline: 'Hors ligne',
      maintenance: 'Maintenance'
    };
    return labels[status as keyof typeof labels] || status;
  }

  protected getMachineStatusSeverity(status: string): string {
    const severities = {
      online: 'success',
      offline: 'danger',
      maintenance: 'warning'
    };
    return severities[status as keyof typeof severities] || 'info';
  }

  protected getMachineStatusIcon(status: string): string {
    const icons = {
      online: 'pi pi-check',
      offline: 'pi pi-times',
      maintenance: 'pi pi-wrench'
    };
    return icons[status as keyof typeof icons] || 'pi pi-info';
  }

  protected getActivityIcon(type: string): string {
    const icons = {
      game_started: 'pi pi-play',
      game_ended: 'pi pi-stop',
      user_registered: 'pi pi-user-plus',
      machine_maintenance: 'pi pi-wrench'
    };
    return icons[type as keyof typeof icons] || 'pi pi-info';
  }

  protected getRelativeTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    
    return timestamp.toLocaleDateString('fr-FR');
  }

  // Navigation
  protected navigateToUsers(): void {
    // this.router.navigate(['/users']);
  }

  protected navigateToMachines(): void {
    // this.router.navigate(['/arcade-machines']);
  }

  protected navigateToParties(): void {
    // this.router.navigate(['/parties']);
  }

  protected startNewGame(): void {
    // Logique pour démarrer une nouvelle partie
  }

  protected openMaintenance(): void {
    // Ouvrir l'interface de maintenance
  }

  protected viewDetailedStats(): void {
    // this.router.navigate(['/statistics']);
  }
}