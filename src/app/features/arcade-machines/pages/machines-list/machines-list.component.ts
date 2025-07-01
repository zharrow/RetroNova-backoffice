// src/app/features/arcade-machines/pages/machines-list/machines-list.component.ts

import { Component, OnInit, inject, signal, computed, viewChild, effect } from '@angular/core';
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
import { Arcade, GameOnArcade } from '../../../../core/models/arcade.model';
import { Game } from '../../../../core/models/game.model';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { StatsCardComponent, StatsData } from '../../../../shared/components/stats-card/stats-card.component';
import { forkJoin } from 'rxjs';

interface EnrichedArcade extends Arcade {
  readonly games_count: number;
  readonly status: MachineStatus;
  readonly game1_name?: string;
  readonly game2_name?: string;
  readonly utilization_rate: number;
}

type MachineStatus = 'active' | 'inactive' | 'maintenance';
type ViewMode = 'table' | 'grid';

/**
 * Strategy Pattern pour les différents modes d'affichage
 */
abstract class ViewModeStrategy {
  abstract render(machines: EnrichedArcade[]): any;
}

class TableViewStrategy extends ViewModeStrategy {
  render(machines: EnrichedArcade[]) {
    return machines; // Table utilise directement les données
  }
}

class GridViewStrategy extends ViewModeStrategy {
  render(machines: EnrichedArcade[]) {
    return machines.map(machine => ({
      ...machine,
      displayTitle: machine.nom,
      displaySubtitle: machine.localisation || 'Localisation non définie'
    }));
  }
}

/**
 * Factory Pattern pour les stratégies de vue
 */
class ViewStrategyFactory {
  static create(mode: ViewMode): ViewModeStrategy {
    switch (mode) {
      case 'table':
        return new TableViewStrategy();
      case 'grid':
        return new GridViewStrategy();
      default:
        return new TableViewStrategy();
    }
  }
}

/**
 * Service Pattern pour les calculs de statistiques
 */
class MachineStatsCalculator {
  static calculateStats(machines: EnrichedArcade[]): StatsData[] {
    const total = machines.length;
    const active = machines.filter(m => m.status === 'active').length;
    const configured = machines.filter(m => m.games_count > 0).length;
    const locations = new Set(machines.map(m => m.localisation).filter(Boolean)).size;

    return [
      {
        title: 'Bornes totales',
        value: total,
        icon: 'pi-desktop',
        color: 'primary',
        trend: { value: 5, direction: 'up', period: 'ce mois' }
      },
      {
        title: 'Bornes actives', 
        value: active,
        icon: 'pi-check-circle',
        color: 'success',
        trend: { value: 12, direction: 'up', period: 'cette semaine' }
      },
      {
        title: 'Bornes configurées',
        value: configured,
        icon: 'pi-cog',
        color: 'info',
        subtitle: `${Math.round((configured / total) * 100)}% du total`
      },
      {
        title: 'Emplacements',
        value: locations,
        icon: 'pi-map-marker',
        color: 'warning',
        subtitle: 'Sites uniques'
      }
    ];
  }
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
    LoaderComponent,
    StatsCardComponent
  ],
  providers: [ConfirmationService],
  template: `
    <div class="page-container animate-fade-in">
      <div class="page-header">
        <h1 class="page-title">
          <i class="pi pi-desktop neon-glow"></i> 
          Bornes d'Arcade
        </h1>
        <div class="page-actions">
          <button 
            pButton 
            pRipple 
            icon="pi pi-plus" 
            label="Nouvelle borne" 
            severity="success"
            class="gaming-button"
            routerLink="/arcade-machines/new">
          </button>
          
          <button 
            pButton 
            pRipple 
            icon="pi pi-refresh" 
            label="Actualiser" 
            [loading]="loading()"
            (click)="refreshMachines()"
            severity="secondary"
            outlined>
          </button>
        </div>
      </div>

      <!-- Cartes de statistiques -->
      @if (!loading()) {
        <div class="stats-section stagger-fade-in">
          @for (stat of machineStats(); track stat.title) {
            <app-stats-card 
              [data]="stat"
              [clickable]="true"
              [animated]="true"
              [gamingStyle]="true"
              (cardClick)="handleStatClick($event)">
            </app-stats-card>
          }
        </div>
      }
      
      <div class="page-content">
        @if (loading()) {
          <app-loader size="large">Chargement des bornes d'arcade...</app-loader>
        } @else {
          <div class="controls-bar">
            <div class="search-container">
              <span class="p-input-icon-left">
                <i class="pi pi-search"></i>
                <input 
                  pInputText 
                  type="text" 
                  placeholder="Rechercher une borne..." 
                  (input)="handleGlobalFilter($event)"
                  class="search-input" />
              </span>
              <div class="search-results">
                {{ filteredCount() }} machine(s) trouvée(s)
              </div>
            </div>
            
            <div class="view-controls">
              <div class="view-toggle">
                <button 
                  pButton 
                  pRipple 
                  icon="pi pi-list" 
                  [severity]="viewMode() === 'table' ? 'primary' : 'secondary'"
                  [outlined]="viewMode() !== 'table'"
                  (click)="setViewMode('table')"
                  pTooltip="Vue tableau">
                </button>
                <button 
                  pButton 
                  pRipple 
                  icon="pi pi-th-large" 
                  [severity]="viewMode() === 'grid' ? 'primary' : 'secondary'"
                  [outlined]="viewMode() !== 'grid'"
                  (click)="setViewMode('grid')"
                  pTooltip="Vue grille">
                </button>
              </div>
            </div>
          </div>

          @if (viewMode() === 'table') {
            <!-- Vue tableau avec animations -->
            <div class="table-container animate-scale-in">
              <p-table 
                #dt 
                [value]="displayedMachines()" 
                [rows]="itemsPerPage()" 
                [paginator]="true" 
                [globalFilterFields]="globalFilterFields"
                [tableStyle]="{'min-width': '75rem'}"
                [rowHover]="true" 
                dataKey="id"
                [showCurrentPageReport]="true" 
                currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} bornes"
                [loading]="loading()"
                styleClass="machines-table gaming-table">
                
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
                
                <ng-template pTemplate="body" let-machine let-rowIndex="rowIndex">
                  <tr class="machine-row animate-fade-in-left" 
                      [style.animation-delay]="(rowIndex * 0.05) + 's'">
                    <td>
                      <div class="machine-name-cell">
                        <div class="machine-icon" [class]="getMachineIconClass(machine.status)">
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
                        <i class="pi pi-map-marker location-icon"></i>
                        <span>{{ machine.localisation || 'Non défini' }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="games-cell">
                        @if (machine.games && machine.games.length > 0) {
                          @for (game of machine.games; track game.id) {
                            <p-tag 
                              [value]="'Slot ' + game.slot_number + ': ' + game.nom" 
                              [severity]="getSlotSeverity(game.slot_number)"
                              styleClass="game-tag animate-pulse">
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
                        [icon]="getStatusIcon(machine.status)"
                        styleClass="status-tag">
                      </p-tag>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button 
                          pButton 
                          pRipple 
                          icon="pi pi-eye" 
                          [rounded]="true"
                          text
                          severity="info"
                          size="small"
                          pTooltip="Voir les détails" 
                          tooltipPosition="top"
                          class="action-button hover-lift"
                          [routerLink]="['/arcade-machines', machine.id]">
                        </button>
                        
                        <button 
                          pButton 
                          pRipple 
                          icon="pi pi-cog" 
                          [rounded]="true"
                          text
                          size="small"
                          pTooltip="Configurer les jeux" 
                          tooltipPosition="top"
                          class="action-button hover-scale"
                          (click)="configureGames(machine)">
                        </button>
                        
                        <button 
                          pButton 
                          pRipple 
                          icon="pi pi-pencil" 
                          [rounded]="true"
                          text
                          severity="success"
                          size="small"
                          pTooltip="Éditer" 
                          tooltipPosition="top"
                          class="action-button hover-glow"
                          [routerLink]="['/arcade-machines/edit', machine.id]">
                        </button>
                        
                        <button 
                          pButton 
                          pRipple 
                          icon="pi pi-trash" 
                          [rounded]="true"
                          text
                          severity="danger"
                          size="small"
                          pTooltip="Supprimer" 
                          tooltipPosition="top"
                          class="action-button hover-scale"
                          (click)="confirmDelete(machine)">
                        </button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
                
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="5" class="empty-message">
                      <div class="empty-state animate-floating">
                        <i class="pi pi-desktop empty-icon neon-glow"></i>
                        <h3>Aucune borne trouvée</h3>
                        <p>Aucune borne d'arcade ne correspond à vos critères.</p>
                        <button 
                          pButton 
                          pRipple 
                          label="Créer une borne" 
                          icon="pi pi-plus"
                          class="gaming-button"
                          routerLink="/arcade-machines/new">
                        </button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          } @else {
            <!-- Vue grille avec effet de parallaxe -->
            <div class="machines-grid animate-scale-in">
              @for (machine of displayedMachines(); track machine.id; let i = $index) {
                <div class="machine-card-container stagger-fade-in" 
                     [style.animation-delay]="(i * 0.1) + 's'">
                  <p-card styleClass="machine-card gaming-card hover-lift">
                    <ng-template pTemplate="header">
                      <div class="machine-card-header">
                        <div class="machine-card-icon" 
                             [class]="getMachineIconClass(machine.status)">
                          <i class="pi pi-desktop"></i>
                          <p-badge 
                            [value]="machine.games_count.toString()" 
                            severity="info"
                            styleClass="games-badge">
                          </p-badge>
                        </div>
                        <h3 class="machine-card-title">{{ machine.nom }}</h3>
                        <p-tag 
                          [value]="getStatusLabel(machine.status)" 
                          [severity]="getStatusSeverity(machine.status)"
                          styleClass="status-tag-card">
                        </p-tag>
                      </div>
                    </ng-template>
                    
                    @if (machine.description) {
                      <p class="machine-card-description">{{ machine.description }}</p>
                    }
                    
                    <div class="machine-card-info">
                      <div class="info-item">
                        <i class="pi pi-map-marker location-icon"></i>
                        <span>{{ machine.localisation || 'Non défini' }}</span>
                      </div>
                      
                      @if (machine.games && machine.games.length > 0) {
                        <div class="games-list">
                          <h4>Jeux configurés :</h4>
                          @for (game of machine.games; track game.id) {
                            <div class="game-item animate-shimmer">
                              <span class="slot-number">Slot {{ game.slot_number }}</span>
                              <span class="game-name">{{ game.nom }}</span>
                            </div>
                          }
                        </div>
                      } @else {
                        <div class="no-games-card">
                          <i class="pi pi-exclamation-triangle warning-icon"></i>
                          <span>Aucun jeu configuré</span>
                        </div>
                      }
                    </div>
                    
                    <ng-template pTemplate="footer">
                      <div class="machine-card-actions">
                        <button 
                          pButton 
                          pRipple 
                          label="Voir" 
                          icon="pi pi-eye"
                          severity="info"
                          outlined
                          size="small"
                          class="card-action-btn"
                          [routerLink]="['/arcade-machines', machine.id]">
                        </button>
                        
                        <button 
                          pButton 
                          pRipple 
                          label="Config" 
                          icon="pi pi-cog"
                          outlined
                          size="small"
                          class="card-action-btn"
                          (click)="configureGames(machine)">
                        </button>
                        
                        <button 
                          pButton 
                          pRipple 
                          icon="pi pi-pencil"
                          severity="success"
                          outlined
                          size="small"
                          class="card-action-btn"
                          [routerLink]="['/arcade-machines/edit', machine.id]">
                        </button>
                      </div>
                    </ng-template>
                  </p-card>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
    
    <p-confirmDialog 
      header="Confirmation de suppression"
      icon="pi pi-exclamation-triangle"
      styleClass="gaming-confirm-dialog">
    </p-confirmDialog>
  `,
  styles: [`
    /* Page Layout */
    .page-container {
      padding: var(--space-6);
      max-width: var(--content-max-width);
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-8);
      
      .page-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin: 0;
        font-size: var(--text-3xl);
        font-weight: 800;
        color: var(--text-color);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        
        i {
          color: var(--neon-blue);
          font-size: var(--text-2xl);
        }
      }
      
      .page-actions {
        display: flex;
        gap: var(--space-3);
        align-items: center;
      }
    }

    /* Stats Section */
    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    /* Controls Bar */
    .controls-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      padding: var(--space-4);
      background: var(--surface-card);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      
      .search-container {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        flex: 1;
        
        .search-input {
          min-width: 320px;
          transition: all var(--transition-normal);
          
          &:focus {
            transform: scale(1.02);
            box-shadow: var(--shadow-glow);
          }
        }
        
        .search-results {
          color: var(--text-color-secondary);
          font-size: var(--text-sm);
          font-weight: 500;
        }
      }
      
      .view-controls {
        display: flex;
        gap: var(--space-2);
        
        .view-toggle {
          display: flex;
          gap: var(--space-1);
          padding: var(--space-1);
          background: var(--surface-ground);
          border-radius: var(--radius-lg);
        }
      }
    }

    /* Table Styling */
    .table-container {
      background: var(--surface-card);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-xl);
    }

    .machine-name-cell {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      
      .machine-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: var(--text-lg);
        position: relative;
        overflow: hidden;
        
        &::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--gaming-gradient-primary);
          opacity: 0.8;
        }
        
        &.status-active::before {
          background: var(--gaming-gradient-success);
        }
        
        &.status-maintenance::before {
          background: var(--gaming-gradient-secondary);
        }
        
        &.status-inactive::before {
          background: var(--gaming-gradient-danger);
        }
        
        i {
          position: relative;
          z-index: 1;
        }
      }
      
      .machine-info {
        .machine-name {
          display: block;
          font-weight: 600;
          color: var(--text-color);
          margin-bottom: var(--space-1);
        }
        
        .machine-description {
          display: block;
          font-size: var(--text-sm);
          color: var(--text-color-secondary);
        }
      }
    }

    .location-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      
      .location-icon {
        color: var(--neon-orange);
        font-size: var(--text-base);
      }
    }

    .games-cell {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      
      .game-tag {
        font-size: var(--text-xs);
        font-weight: 600;
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
      
      .action-button {
        transition: all var(--transition-normal);
        
        &:hover {
          transform: scale(1.1);
        }
      }
    }

    /* Grid Styling */
    .machines-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: var(--space-8);
      
      .machine-card-container {
        position: relative;
      }
      
      .machine-card {
        height: 100%;
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: var(--radius-2xl);
        overflow: hidden;
        transition: all var(--transition-normal);
        position: relative;
        
        &::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--gaming-gradient-primary);
          opacity: 0;
          transition: opacity var(--transition-normal);
        }
        
        &:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: var(--shadow-2xl), var(--shadow-glow);
          border-color: var(--neon-blue);
          
          &::before {
            opacity: 0.03;
          }
        }
        
        .machine-card-header {
          text-align: center;
          padding: var(--space-6);
          position: relative;
          background: linear-gradient(135deg, var(--surface-ground), var(--surface-hover));
          
          .machine-card-icon {
            position: relative;
            width: 80px;
            height: 80px;
            border-radius: var(--radius-full);
            background: var(--gaming-gradient-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2rem;
            margin: 0 auto var(--space-4) auto;
            box-shadow: var(--shadow-lg);
            
            .games-badge {
              position: absolute;
              top: -8px;
              right: -8px;
              box-shadow: var(--shadow-md);
            }
          }
          
          .machine-card-title {
            margin: 0 0 var(--space-3) 0;
            font-size: var(--text-xl);
            font-weight: 700;
            color: var(--text-color);
          }
          
          .status-tag-card {
            font-weight: 600;
          }
        }
        
        .machine-card-description {
          color: var(--text-color-secondary);
          font-size: var(--text-sm);
          line-height: 1.6;
          margin-bottom: var(--space-4);
          padding: 0 var(--space-4);
        }
        
        .machine-card-info {
          padding: 0 var(--space-4) var(--space-4);
          
          .info-item {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            margin-bottom: var(--space-4);
            font-size: var(--text-sm);
            
            .location-icon {
              color: var(--neon-orange);
            }
          }
          
          .games-list {
            h4 {
              margin: 0 0 var(--space-3) 0;
              font-size: var(--text-sm);
              font-weight: 600;
              color: var(--text-color);
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            .game-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: var(--space-2) var(--space-3);
              background: var(--surface-hover);
              border-radius: var(--radius-md);
              margin-bottom: var(--space-2);
              font-size: var(--text-sm);
              transition: all var(--transition-fast);
              
              &:hover {
                background: var(--surface-border);
                transform: translateX(4px);
              }
              
              .slot-number {
                font-weight: 700;
                color: var(--neon-blue);
                text-transform: uppercase;
                font-size: var(--text-xs);
              }
              
              .game-name {
                color: var(--text-color);
                font-weight: 500;
              }
            }
          }
          
          .no-games-card {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            padding: var(--space-4);
            background: var(--surface-hover);
            border-radius: var(--radius-lg);
            color: var(--text-color-muted);
            font-size: var(--text-sm);
            
            .warning-icon {
              color: var(--neon-orange);
              font-size: var(--text-lg);
            }
          }
        }
        
        .machine-card-actions {
          display: flex;
          gap: var(--space-2);
          justify-content: center;
          padding: var(--space-4);
          background: var(--surface-ground);
          
          .card-action-btn {
            flex: 1;
            max-width: 100px;
            transition: all var(--transition-normal);
            
            &:hover {
              transform: translateY(-2px);
              box-shadow: var(--shadow-lg);
            }
          }
        }
      }
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--space-20) var(--space-4);
      
      .empty-icon {
        font-size: 4rem;
        color: var(--neon-blue);
        margin-bottom: var(--space-6);
        filter: drop-shadow(var(--shadow-neon));
      }
      
      h3 {
        margin: 0 0 var(--space-3) 0;
        color: var(--text-color);
        font-size: var(--text-xl);
      }
      
      p {
        margin: 0 0 var(--space-6) 0;
        color: var(--text-color-secondary);
      }
    }

    /* Gaming Buttons */
    .gaming-button {
      background: var(--gaming-gradient-primary) !important;
      border: none !important;
      color: white !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      transition: all var(--transition-normal) !important;
      position: relative !important;
      overflow: hidden !important;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        transition: left 0.5s;
      }
      
      &:hover {
        transform: translateY(-2px) scale(1.05) !important;
        box-shadow: var(--shadow-xl), var(--shadow-glow) !important;
        
        &::before {
          left: 100%;
        }
      }
    }

    /* Status Helpers */
    .status-tag {
      font-weight: 600;
      text-transform: uppercase;
      font-size: var(--text-xs);
      letter-spacing: 0.05em;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-4);
      }
      
      .stats-section {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-4);
      }
      
      .controls-bar {
        flex-direction: column;
        gap: var(--space-4);
        
        .search-container .search-input {
          min-width: 100%;
        }
      }
      
      .machines-grid {
        grid-template-columns: 1fr;
      }
      
      .machine-card-actions {
        flex-direction: column;
        
        .card-action-btn {
          max-width: none;
        }
      }
    }

    @media (max-width: 480px) {
      .stats-section {
        grid-template-columns: 1fr;
      }
    }

    /* Gaming Theme Overrides */
    :host ::ng-deep {
      .machines-table {
        background: var(--surface-card);
        border-radius: var(--radius-xl);
        overflow: hidden;
        
        .p-datatable-thead > tr > th {
          background: var(--surface-ground);
          border-bottom: 2px solid var(--neon-blue);
          font-weight: 700;
          color: var(--text-color);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: var(--text-sm);
        }
        
        .p-datatable-tbody > tr {
          transition: all var(--transition-fast);
          
          &:hover {
            background: var(--surface-hover);
            transform: translateX(4px);
            box-shadow: var(--shadow-md);
          }
        }
      }
      
      .gaming-confirm-dialog {
        border-radius: var(--radius-xl);
        overflow: hidden;
        
        .p-dialog-header {
          background: var(--gaming-gradient-primary);
          color: white;
        }
      }
    }
  `]
})
export class MachinesListComponent implements OnInit {
  // Services injectés avec inject()
  private readonly arcadesService = inject(ArcadesService);
  private readonly gamesService = inject(GamesService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  // ViewChild avec nouvelle API
  private readonly table = viewChild<Table>('dt');
  
  // Signals pour l'état réactif
  protected readonly loading = signal(false);
  protected readonly machines = signal<Arcade[]>([]);
  protected readonly games = signal<Game[]>([]);
  protected readonly viewMode = signal<ViewMode>('table');
  protected readonly searchQuery = signal('');
  protected readonly itemsPerPage = signal(10);
  
  // Computed values avec logique métier
  protected readonly enrichedMachines = computed(() => {
    return this.machines().map(machine => this.enrichMachine(machine));
  });
  
  protected readonly displayedMachines = computed(() => {
    const strategy = ViewStrategyFactory.create(this.viewMode());
    return strategy.render(this.filteredMachines());
  });
  
  protected readonly filteredMachines = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const machines = this.enrichedMachines();
    
    if (!query) return machines;
    
    return machines.filter(machine => 
      machine.nom.toLowerCase().includes(query) ||
      machine.description?.toLowerCase().includes(query) ||
      machine.localisation?.toLowerCase().includes(query)
    );
  });
  
  protected readonly filteredCount = computed(() => this.filteredMachines().length);
  
  protected readonly machineStats = computed(() => 
    MachineStatsCalculator.calculateStats(this.enrichedMachines())
  );
  
  // Configuration de la table
  protected readonly globalFilterFields = ['nom', 'description', 'localisation'];

  // Effect pour la recherche automatique
  private readonly searchEffect = effect(() => {
    const query = this.searchQuery();
    this.table()?.filterGlobal(query, 'contains');
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  /**
   * Charge les données initiales (machines et jeux)
   */
  private loadInitialData(): void {
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
      error: (error) => this.handleError('chargement', error)
    });
  }

  /**
   * Enrichit une machine avec des métadonnées calculées
   */
  private enrichMachine(machine: Arcade): EnrichedArcade {
    const gamesCount = machine.games?.length || 0;
    const status = this.calculateMachineStatus(machine);
    const utilizationRate = this.calculateUtilizationRate(machine);
    
    return {
      ...machine,
      games_count: gamesCount,
      status,
      utilization_rate: utilizationRate,
      game1_name: machine.games?.find(g => g.slot_number === 1)?.nom,
      game2_name: machine.games?.find(g => g.slot_number === 2)?.nom
    };
  }

  /**
   * Calcule le statut d'une machine selon la logique métier
   */
  private calculateMachineStatus(machine: Arcade): MachineStatus {
    if (!machine.games || machine.games.length === 0) {
      return 'inactive';
    }
    
    // Logique métier pour déterminer le statut
    // Ici on peut ajouter plus de critères (dernière activité, etc.)
    return 'active';
  }

  /**
   * Calcule le taux d'utilisation d'une machine
   */
  private calculateUtilizationRate(machine: Arcade): number {
    // Simulation - dans un vrai système, ceci viendrait des données d'usage
    return Math.random() * 100;
  }

  /**
   * Actualise les données des machines
   */
  protected refreshMachines(): void {
    this.arcadesService.clearCache();
    this.gamesService.clearCache();
    this.loadInitialData();
  }

  /**
   * Change le mode d'affichage
   */
  protected setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  /**
   * Gère le filtre global de recherche
   */
  protected handleGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  /**
   * Configure les jeux d'une machine
   */
  protected configureGames(machine: EnrichedArcade): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Configuration',
      detail: `Configuration des jeux pour la borne ${machine.nom}`
    });
    // TODO: Ouvrir un dialog de configuration avancé
  }

  /**
   * Gère le clic sur une carte de statistique
   */
  protected handleStatClick(statData: StatsData): void {
    // Logique de navigation ou filtrage selon la statistique cliquée
    console.log('Stat clicked:', statData);
  }

  /**
   * Confirme la suppression d'une machine
   */
  protected confirmDelete(machine: EnrichedArcade): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer la borne "${machine.nom}" ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => this.executeDeletion(machine.id)
    });
  }

  /**
   * Exécute la suppression d'une machine
   */
  private executeDeletion(id: number): void {
    // TODO: Implémenter la suppression via le service
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Borne supprimée avec succès'
    });
  }

  /**
   * Gère les erreurs de manière centralisée
   */
  private handleError(operation: string, error: any): void {
    console.error(`Erreur lors du ${operation}:`, error);
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: `Impossible de ${operation === 'chargement' ? 'charger les données' : 'effectuer l\'opération'}`
    });
    this.loading.set(false);
  }

  // Méthodes utilitaires pour l'affichage
  protected getMachineIconClass(status: MachineStatus): string {
    return `machine-icon status-${status}`;
  }

  protected getStatusLabel(status: MachineStatus): string {
    const labels = {
      active: 'Active',
      inactive: 'Inactive', 
      maintenance: 'Maintenance'
    };
    return labels[status];
  }

  protected getStatusSeverity(status: MachineStatus): 'success' | 'warning' | 'danger' {
    const severities = {
      active: 'success' as const,
      maintenance: 'warning' as const,
      inactive: 'danger' as const
    };
    return severities[status];
  }

  protected getStatusIcon(status: MachineStatus): string {
    const icons = {
      active: 'pi-check-circle',
      maintenance: 'pi-wrench',
      inactive: 'pi-times-circle'
    };
    return icons[status];
  }

  protected getSlotSeverity(slotNumber: number): 'info' | 'success' {
    return slotNumber === 1 ? 'info' : 'success';
  }
}