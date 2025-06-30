// src/app/features/arcade-machines/pages/machines-list/machines-list.component.ts

import { Component, OnInit, inject, signal, viewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ArcadesService } from '../../../../core/services/arcades.service';
import { GamesService } from '../../../../core/services/games.service';
import { Arcade } from '../../../../core/models/arcade.model';
import { Game } from '../../../../core/models/game.model';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { forkJoin } from 'rxjs';

interface ArcadeWithGames extends Arcade {
  game1_name?: string;
  game2_name?: string;
  games_count: number;
  status: 'active' | 'inactive' | 'maintenance';
}

@Component({
  selector: 'app-machines-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    RippleModule,
    InputTextModule,
    ConfirmDialogModule,
    TooltipModule,
    TagModule,
    CardModule,
    BadgeModule,
    LoaderComponent
  ],
  providers: [ConfirmationService],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1><i class="pi pi-desktop"></i> Bornes d'Arcade</h1>
        <div class="page-actions">
          <p-button 
            icon="pi pi-plus" 
            label="Nouvelle borne" 
            severity="success"
            routerLink="/arcade-machines/new">
          </p-button>
          
          <p-button 
            icon="pi pi-refresh" 
            label="Actualiser" 
            [loading]="loading()"
            (click)="refreshMachines()"
            severity="secondary"
            outlined>
          </p-button>
        </div>
      </div>

      <!-- Statistiques rapides -->
      <div class="stats-cards" *ngIf="!loading()">
        <p-card styleClass="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-desktop"></i>
            </div>
            <div class="stat-details">
              <h3>{{ totalMachines() }}</h3>
              <p>Bornes totales</p>
            </div>
          </div>
        </p-card>
        
        <p-card styleClass="stat-card active">
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="stat-details">
              <h3>{{ activeMachines() }}</h3>
              <p>Bornes actives</p>
            </div>
          </div>
        </p-card>
        
        <p-card styleClass="stat-card configured">
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-cog"></i>
            </div>
            <div class="stat-details">
              <h3>{{ configuredMachines() }}</h3>
              <p>Bornes configurées</p>
            </div>
          </div>
        </p-card>
        
        <p-card styleClass="stat-card locations">
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-map-marker"></i>
            </div>
            <div class="stat-details">
              <h3>{{ uniqueLocations() }}</h3>
              <p>Emplacements</p>
            </div>
          </div>
        </p-card>
      </div>
      
      <div class="page-content">
        @if (loading()) {
          <app-loader size="large">Chargement des bornes d'arcade...</app-loader>
        } @else {
          <div class="search-container">
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <input 
                pInputText 
                type="text" 
                placeholder="Rechercher une borne..." 
                (input)="applyFilterGlobal($event)" />
            </span>
            <div class="view-toggle">
              <p-button 
                icon="pi pi-list" 
                [severity]="viewMode() === 'table' ? 'primary' : 'secondary'"
                [outlined]="viewMode() !== 'table'"
                (click)="setViewMode('table')"
                pTooltip="Vue tableau">
              </p-button>
              <p-button 
                icon="pi pi-th-large" 
                [severity]="viewMode() === 'grid' ? 'primary' : 'secondary'"
                [outlined]="viewMode() !== 'grid'"
                (click)="setViewMode('grid')"
                pTooltip="Vue grille">
              </p-button>
            </div>
          </div>

          @if (viewMode() === 'table') {
            <!-- Vue tableau -->
            <p-table 
              #dt 
              [value]="enrichedMachines()" 
              [rows]="10" 
              [paginator]="true" 
              [globalFilterFields]="['nom', 'description', 'localisation']"
              [tableStyle]="{'min-width': '75rem'}"
              [rowHover]="true" 
              dataKey="id"
              [showCurrentPageReport]="true" 
              currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} bornes"
              [loading]="loading()"
              styleClass="machines-table">
              
              <ng-template pTemplate="header">
                <tr>
                  <th pSortableColumn="nom" style="width: 25%">
                    Nom <p-sortIcon field="nom"></p-sortIcon>
                  </th>
                  <th pSortableColumn="localisation" style="width: 20%">
                    Localisation <p-sortIcon field="localisation"></p-sortIcon>
                  </th>
                  <th style="width: 20%">Jeux</th>
                  <th pSortableColumn="status" style="width: 15%">
                    Statut <p-sortIcon field="status"></p-sortIcon>
                  </th>
                  <th style="width: 20%">Actions</th>
                </tr>
              </ng-template>
              
              <ng-template pTemplate="body" let-machine>
                <tr>
                  <td>
                    <div class="machine-name-cell">
                      <div class="machine-icon">
                        <i class="pi pi-desktop"></i>
                      </div>
                      <div class="machine-info">
                        <span class="machine-name">{{ machine.nom }}</span>
                        @if (machine.description) {
                          <span class="machine-description">{{ machine.description }}</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="location-cell">
                      <i class="pi pi-map-marker"></i>
                      <span>{{ machine.localisation || 'Non défini' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="games-cell">
                      @if (machine.games && machine.games.length > 0) {
                        @for (game of machine.games; track game.id) {
                          <p-tag 
                            [value]="'Slot ' + game.slot_number + ': ' + game.nom" 
                            [severity]="game.slot_number === 1 ? 'info' : 'success'"
                            styleClass="game-tag">
                          </p-tag>
                        }
                      } @else {
                        <span class="no-games">Aucun jeu configuré</span>
                      }
                    </div>
                  </td>
                  <td>
                    <p-tag 
                      [value]="getStatusLabel(machine.status)" 
                      [severity]="getStatusSeverity(machine.status)"
                      [icon]="getStatusIcon(machine.status)">
                    </p-tag>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <p-button 
                        icon="pi pi-eye" 
                        [rounded]="true"
                        text
                        severity="info"
                        size="small"
                        pTooltip="Voir les détails" 
                        tooltipPosition="top"
                        [routerLink]="['/arcade-machines', machine.id]">
                      </p-button>
                      
                      <p-button 
                        icon="pi pi-cog" 
                        [rounded]="true"
                        text
                        severity="warning"
                        size="small"
                        pTooltip="Configurer les jeux" 
                        tooltipPosition="top"
                        (click)="configureGames(machine)">
                      </p-button>
                      
                      <p-button 
                        icon="pi pi-pencil" 
                        [rounded]="true"
                        text
                        severity="success"
                        size="small"
                        pTooltip="Éditer" 
                        tooltipPosition="top"
                        [routerLink]="['/arcade-machines/edit', machine.id]">
                      </p-button>
                      
                      <p-button 
                        icon="pi pi-trash" 
                        [rounded]="true"
                        text
                        severity="danger"
                        size="small"
                        pTooltip="Supprimer" 
                        tooltipPosition="top"
                        (click)="confirmDelete(machine)">
                      </p-button>
                    </div>
                  </td>
                </tr>
              </ng-template>
              
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="5" class="empty-message">
                    <div class="empty-state">
                      <i class="pi pi-desktop empty-icon"></i>
                      <h3>Aucune borne trouvée</h3>
                      <p>Aucune borne d'arcade ne correspond à vos critères.</p>
                      <p-button 
                        label="Créer une borne" 
                        icon="pi pi-plus"
                        routerLink="/arcade-machines/new">
                      </p-button>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          } @else {
            <!-- Vue grille -->
            <div class="machines-grid">
              @for (machine of enrichedMachines(); track machine.id) {
                <p-card styleClass="machine-card">
                  <ng-template pTemplate="header">
                    <div class="machine-card-header">
                      <div class="machine-card-icon">
                        <i class="pi pi-desktop"></i>
                        <p-badge 
                          [value]="machine.games_count.toString()" 
                          severity="info">
                        </p-badge>
                      </div>
                      <h3>{{ machine.nom }}</h3>
                      <p-tag 
                        [value]="getStatusLabel(machine.status)" 
                        [severity]="getStatusSeverity(machine.status)">
                      </p-tag>
                    </div>
                  </ng-template>
                  
                  @if (machine.description) {
                    <p class="machine-card-description">{{ machine.description }}</p>
                  }
                  
                  <div class="machine-card-info">
                    <div class="info-item">
                      <i class="pi pi-map-marker"></i>
                      <span>{{ machine.localisation || 'Non défini' }}</span>
                    </div>
                    
                    @if (machine.games && machine.games.length > 0) {
                      <div class="games-list">
                        <h4>Jeux configurés :</h4>
                        @for (game of machine.games; track game.id) {
                          <div class="game-item">
                            <span class="slot-number">Slot {{ game.slot_number }}</span>
                            <span class="game-name">{{ game.nom }}</span>
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="no-games-card">
                        <i class="pi pi-exclamation-triangle"></i>
                        <span>Aucun jeu configuré</span>
                      </div>
                    }
                  </div>
                  
                  <ng-template pTemplate="footer">
                    <div class="machine-card-actions">
                      <p-button 
                        label="Voir" 
                        icon="pi pi-eye"
                        severity="info"
                        outlined
                        size="small"
                        [routerLink]="['/arcade-machines', machine.id]">
                      </p-button>
                      
                      <p-button 
                        label="Config" 
                        icon="pi pi-cog"
                        severity="warning"
                        outlined
                        size="small"
                        (click)="configureGames(machine)">
                      </p-button>
                      
                      <p-button 
                        icon="pi pi-pencil"
                        severity="success"
                        outlined
                        size="small"
                        [routerLink]="['/arcade-machines/edit', machine.id]">
                      </p-button>
                    </div>
                  </ng-template>
                </p-card>
              }
            </div>
          }
        }
      </div>
    </div>
    
    <p-confirmDialog 
      header="Confirmation de suppression"
      icon="pi pi-exclamation-triangle">
    </p-confirmDialog>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      
      h1 {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin: 0;
        font-size: var(--text-2xl);
        font-weight: 700;
        color: var(--text-color);
        
        i {
          color: var(--primary-500);
        }
      }
      
      .page-actions {
        display: flex;
        gap: var(--space-3);
      }
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
      
      .stat-card {
        .stat-content {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          
          .stat-icon {
            width: 50px;
            height: 50px;
            border-radius: var(--radius-lg);
            background: var(--gradient-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
          }
          
          .stat-details {
            h3 {
              margin: 0;
              font-size: var(--text-2xl);
              font-weight: 700;
              color: var(--text-color);
            }
            
            p {
              margin: 0;
              color: var(--text-color-secondary);
              font-size: var(--text-sm);
            }
          }
        }
        
        &.active .stat-icon {
          background: var(--gradient-success);
        }
        
        &.configured .stat-icon {
          background: var(--gradient-secondary);
        }
        
        &.locations .stat-icon {
          background: linear-gradient(135deg, var(--neon-orange), var(--arcade-red));
        }
      }
    }
    
    .search-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
      
      .p-input-icon-left {
        flex: 1;
        max-width: 400px;
      }
      
      .view-toggle {
        display: flex;
        gap: var(--space-1);
      }
    }
    
    .machine-name-cell {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      
      .machine-icon {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-md);
        background: var(--gradient-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: var(--text-lg);
      }
      
      .machine-info {
        .machine-name {
          display: block;
          font-weight: 600;
          color: var(--text-color);
        }
        
        .machine-description {
          display: block;
          font-size: var(--text-sm);
          color: var(--text-color-secondary);
          margin-top: var(--space-1);
        }
      }
    }
    
    .location-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      
      i {
        color: var(--neon-orange);
      }
    }
    
    .games-cell {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      
      .game-tag {
        font-size: var(--text-xs);
      }
      
      .no-games {
        color: var(--text-color-muted);
        font-style: italic;
        font-size: var(--text-sm);
      }
    }
    
    .action-buttons {
      display: flex;
      gap: var(--space-1);
    }
    
    .machines-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: var(--space-6);
      
      .machine-card {
        transition: all var(--transition-normal);
        
        &:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        
        .machine-card-header {
          text-align: center;
          padding: var(--space-4);
          position: relative;
          
          .machine-card-icon {
            position: relative;
            width: 60px;
            height: 60px;
            border-radius: var(--radius-full);
            background: var(--gradient-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            margin: 0 auto var(--space-3) auto;
            
            p-badge {
              position: absolute;
              top: -8px;
              right: -8px;
            }
          }
          
          h3 {
            margin: 0 0 var(--space-2) 0;
            font-size: var(--text-lg);
            font-weight: 600;
            color: var(--text-color);
          }
        }
        
        .machine-card-description {
          color: var(--text-color-secondary);
          font-size: var(--text-sm);
          line-height: 1.5;
          margin-bottom: var(--space-4);
        }
        
        .machine-card-info {
          .info-item {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            margin-bottom: var(--space-3);
            font-size: var(--text-sm);
            
            i {
              color: var(--neon-orange);
            }
          }
          
          .games-list {
            h4 {
              margin: 0 0 var(--space-2) 0;
              font-size: var(--text-sm);
              font-weight: 600;
              color: var(--text-color);
            }
            
            .game-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: var(--space-1) var(--space-2);
              background: var(--surface-hover);
              border-radius: var(--radius-sm);
              margin-bottom: var(--space-1);
              font-size: var(--text-sm);
              
              .slot-number {
                font-weight: 600;
                color: var(--primary-500);
              }
              
              .game-name {
                color: var(--text-color);
              }
            }
          }
          
          .no-games-card {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            padding: var(--space-3);
            background: var(--surface-hover);
            border-radius: var(--radius-md);
            color: var(--text-color-muted);
            font-size: var(--text-sm);
            
            i {
              color: var(--neon-orange);
            }
          }
        }
        
        .machine-card-actions {
          display: flex;
          gap: var(--space-2);
          justify-content: center;
        }
      }
    }
    
    .empty-state {
      text-align: center;
      padding: var(--space-12) var(--space-4);
      
      .empty-icon {
        font-size: 3rem;
        color: var(--gray-400);
        margin-bottom: var(--space-4);
      }
      
      h3 {
        margin: 0 0 var(--space-2) 0;
        color: var(--text-color);
      }
      
      p {
        margin: 0 0 var(--space-4) 0;
        color: var(--text-color-secondary);
      }
    }
    
    :host ::ng-deep {
      .machines-table {
        .p-datatable-thead > tr > th {
          background: var(--surface-ground);
          border-bottom: 2px solid var(--surface-border);
          font-weight: 600;
          color: var(--text-color);
        }
        
        .p-datatable-tbody > tr:hover {
          background: var(--surface-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }
      }
    }
    
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-4);
      }
      
      .stats-cards {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .search-container {
        flex-direction: column;
        gap: var(--space-3);
      }
      
      .machines-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MachinesListComponent implements OnInit {
  // Services injectés
  private readonly arcadesService = inject(ArcadesService);
  private readonly gamesService = inject(GamesService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  // ViewChild pour la table
  readonly table = viewChild<Table>('dt');
  
  // Signals pour l'état du composant
  readonly machines = signal<Arcade[]>([]);
  readonly games = signal<Game[]>([]);
  readonly loading = signal(false);
  readonly viewMode = signal<'table' | 'grid'>('table');
  
  // Computed values pour les données enrichies et statistiques
  readonly enrichedMachines = computed(() => {
    const allMachines = this.machines();
    const allGames = this.games();
    
    return allMachines.map(machine => ({
      ...machine,
      games_count: machine.games?.length || 0,
      status: this.getMachineStatus(machine),
      game1_name: machine.games?.find(g => g.slot_number === 1)?.nom,
      game2_name: machine.games?.find(g => g.slot_number === 2)?.nom
    } as ArcadeWithGames));
  });
  
  readonly totalMachines = computed(() => this.machines().length);
  readonly activeMachines = computed(() => 
    this.enrichedMachines().filter(m => m.status === 'active').length
  );
  readonly configuredMachines = computed(() => 
    this.enrichedMachines().filter(m => m.games_count > 0).length
  );
  readonly uniqueLocations = computed(() => {
    const locations = this.machines()
      .map(m => m.localisation)
      .filter(loc => loc && loc.trim() !== '');
    return new Set(locations).size;
  });

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Charge les données (machines et jeux)
   */
  private loadData(): void {
    this.loading.set(true);
    
    forkJoin({
      machines: this.arcadesService.getAllArcades(),
      games: this.gamesService.getAllGames()
    }).subscribe({
      next: ({ machines, games }) => {
        this.machines.set(machines);
        this.games.set(games);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les données'
        });
        this.loading.set(false);
      }
    });
  }

  /**
   * Actualise les données
   */
  refreshMachines(): void {
    this.arcadesService.clearCache();
    this.gamesService.clearCache();
    this.loadData();
  }

  /**
   * Change le mode d'affichage
   */
  setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode.set(mode);
  }

  /**
   * Applique un filtre global
   */
  applyFilterGlobal(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.table()?.filterGlobal(target.value, 'contains');
  }

  /**
   * Détermine le statut d'une machine
   */
  private getMachineStatus(machine: Arcade): 'active' | 'inactive' | 'maintenance' {
    if (!machine.games || machine.games.length === 0) {
      return 'inactive';
    }
    // Logique métier pour déterminer le statut
    return 'active';
  }

  /**
   * Configure les jeux d'une machine
   */
  configureGames(machine: ArcadeWithGames): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Configuration',
      detail: `Configuration des jeux pour la borne ${machine.nom}`
    });
    // TODO: Ouvrir un dialog de configuration
  }

  /**
   * Confirme la suppression d'une machine
   */
  confirmDelete(machine: ArcadeWithGames): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer la borne "${machine.nom}" ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => this.deleteMachine(machine.id)
    });
  }

  /**
   * Supprime une machine
   */
  private deleteMachine(id: number): void {
    // TODO: Implémenter la suppression via le service
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Borne supprimée avec succès'
    });
  }

  // Méthodes utilitaires pour l'affichage
  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'maintenance': return 'Maintenance';
      default: return 'Inconnu';
    }
  }

  getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    switch (status) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'inactive': return 'danger';
      default: return 'info';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'active': return 'pi-check-circle';
      case 'maintenance': return 'pi-wrench';
      case 'inactive': return 'pi-times-circle';
      default: return 'pi-question-circle';
    }
  }
}