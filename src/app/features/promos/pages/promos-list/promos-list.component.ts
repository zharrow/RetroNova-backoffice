// src/app/features/promos/pages/promos-list/promos-list.component.ts

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
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PromosService } from '../../../../core/services/promos.service';
import { PromoCode } from '../../../../core/models/promo.model';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { StatsCardComponent, StatsData } from '../../../../shared/components/stats-card/stats-card.component';
import { forkJoin } from 'rxjs';

interface EnrichedPromoCode extends PromoCode {
  readonly status: PromoStatus;
  readonly usage_percentage: number;
  readonly remaining_uses: number;
  readonly is_expired: boolean;
  readonly priority_level: number;
}

type PromoStatus = 'active' | 'exhausted' | 'limited' | 'single_use' | 'inactive';
type ViewMode = 'table' | 'grid';

/**
 * Strategy Pattern pour les différents modes d'affichage
 */
abstract class PromoViewStrategy {
  abstract render(promos: EnrichedPromoCode[]): any;
}

class TablePromoViewStrategy extends PromoViewStrategy {
  render(promos: EnrichedPromoCode[]) {
    return promos.sort((a, b) => b.priority_level - a.priority_level);
  }
}

class GridPromoViewStrategy extends PromoViewStrategy {
  render(promos: EnrichedPromoCode[]) {
    return promos.map(promo => ({
      ...promo,
      displayTitle: promo.code,
      displaySubtitle: `${promo.tickets_reward} tickets`
    })).sort((a, b) => b.priority_level - a.priority_level);
  }
}

/**
 * Factory pour les stratégies de vue
 */
class PromoViewStrategyFactory {
  static create(mode: ViewMode): PromoViewStrategy {
    switch (mode) {
      case 'table':
        return new TablePromoViewStrategy();
      case 'grid':
        return new GridPromoViewStrategy();
      default:
        return new TablePromoViewStrategy();
    }
  }
}

/**
 * Service de calcul des statistiques des promos
 */
class PromoStatsCalculator {
  static calculateStats(promos: EnrichedPromoCode[]): StatsData[] {
    const total = promos.length;
    const active = promos.filter(p => p.status === 'active').length;
    const totalUses = promos.reduce((sum, p) => sum + p.current_uses, 0);
    const totalTicketsDistributed = promos.reduce((sum, p) => sum + (p.current_uses * p.tickets_reward), 0);
    const exhausted = promos.filter(p => p.status === 'exhausted').length;

    return [
      {
        title: 'Codes totaux',
        value: total,
        icon: 'pi-ticket',
        color: 'primary',
        trend: { value: 8, direction: 'up', period: 'ce mois' }
      },
      {
        title: 'Codes actifs',
        value: active,
        icon: 'pi-check-circle',
        color: 'success',
        subtitle: `${Math.round((active / total) * 100)}% du total`
      },
      {
        title: 'Utilisations totales',
        value: totalUses,
        icon: 'pi-users',
        color: 'info',
        trend: { value: 15, direction: 'up', period: 'cette semaine' }
      },
      {
        title: 'Tickets distribués',
        value: totalTicketsDistributed,
        icon: 'pi-gift',
        color: 'warning',
        format: 'number'
      }
    ];
  }
}

@Component({
  selector: 'app-promos-list',
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
    ProgressBarModule,
    LoaderComponent,
    StatsCardComponent
  ],
  providers: [ConfirmationService],
  template: `
    <div class="page-container animate-fade-in">
      <div class="page-header">
        <div class="page-title-section">
          <h1 class="page-title">
            <i class="pi pi-ticket neon-glow"></i> 
            Codes Promotionnels
          </h1>
          <p class="page-subtitle">
            Gestion des codes promos et distribution de tickets
          </p>
        </div>
        <div class="page-actions">
          <button 
            pButton 
            pRipple 
            icon="pi pi-plus" 
            label="Nouveau code" 
            severity="success"
            class="gaming-button"
            routerLink="/promos/new">
          </button>
          
          <button 
            pButton 
            pRipple 
            icon="pi pi-download" 
            label="Exporter" 
            severity="info"
            outlined
            (click)="exportPromos()">
          </button>
          
          <button 
            pButton 
            pRipple 
            icon="pi pi-refresh" 
            label="Actualiser" 
            [loading]="loading()"
            (click)="refreshPromos()"
            severity="secondary"
            outlined>
          </button>
        </div>
      </div>

      <!-- Cartes de statistiques -->
      @if (!loading()) {
        <div class="stats-section stagger-fade-in">
          @for (stat of promoStats(); track stat.title) {
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
          <app-loader size="large">
            <div class="loading-content">
              <i class="pi pi-spin pi-cog loading-icon"></i>
              <span>Chargement des codes promotionnels...</span>
            </div>
          </app-loader>
        } @else {
          <div class="controls-bar">
            <div class="search-container">
              <span class="p-input-icon-left search-wrapper">
                <i class="pi pi-search search-icon"></i>
                <input 
                  pInputText 
                  type="text" 
                  placeholder="Rechercher un code promo..." 
                  (input)="handleGlobalFilter($event)"
                  class="search-input gaming-input" />
              </span>
              <div class="search-results">
                <i class="pi pi-filter-fill"></i>
                {{ filteredCount() }} code(s) trouvé(s)
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
                  pTooltip="Vue tableau"
                  class="view-btn">
                </button>
                <button 
                  pButton 
                  pRipple 
                  icon="pi pi-th-large" 
                  [severity]="viewMode() === 'grid' ? 'primary' : 'secondary'"
                  [outlined]="viewMode() !== 'grid'"
                  (click)="setViewMode('grid')"
                  pTooltip="Vue grille"
                  class="view-btn">
                </button>
              </div>
            </div>
          </div>

          @if (viewMode() === 'table') {
            <!-- Vue tableau -->
            <div class="table-container animate-scale-in">
              <p-table 
                #dt 
                [value]="displayedPromos()" 
                [rows]="itemsPerPage()" 
                [paginator]="true" 
                [globalFilterFields]="globalFilterFields"
                [tableStyle]="{'min-width': '75rem'}"
                [rowHover]="true" 
                dataKey="id"
                [showCurrentPageReport]="true" 
                currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} codes"
                [loading]="loading()"
                styleClass="promos-table gaming-table">
                
                <ng-template pTemplate="header">
                  <tr>
                    <th pSortableColumn="code" style="width: 20%">
                      <div class="header-content">
                        <i class="pi pi-ticket"></i>
                        Code <p-sortIcon field="code"></p-sortIcon>
                      </div>
                    </th>
                    <th pSortableColumn="tickets_reward" style="width: 15%">
                      <div class="header-content">
                        <i class="pi pi-gift"></i>
                        Récompense <p-sortIcon field="tickets_reward"></p-sortIcon>
                      </div>
                    </th>
                    <th style="width: 20%">
                      <div class="header-content">
                        <i class="pi pi-cog"></i>
                        Configuration
                      </div>
                    </th>
                    <th style="width: 20%">
                      <div class="header-content">
                        <i class="pi pi-chart-bar"></i>
                        Utilisation
                      </div>
                    </th>
                    <th pSortableColumn="status" style="width: 15%">
                      <div class="header-content">
                        <i class="pi pi-circle"></i>
                        Statut <p-sortIcon field="status"></p-sortIcon>
                      </div>
                    </th>
                    <th style="width: 10%">
                      <div class="header-content">
                        <i class="pi pi-cog"></i>
                        Actions
                      </div>
                    </th>
                  </tr>
                </ng-template>
                
                <ng-template pTemplate="body" let-promo let-rowIndex="rowIndex">
                  <tr class="promo-row animate-fade-in-left" 
                      [style.animation-delay]="(rowIndex * 0.05) + 's'">
                    <td>
                      <div class="promo-code-cell">
                        <div class="code-display">
                          <span class="promo-code">{{ promo.code }}</span>
                          <button 
                            pButton 
                            pRipple 
                            icon="pi pi-copy" 
                            [rounded]="true"
                            text
                            size="small"
                            severity="info"
                            pTooltip="Copier le code"
                            (click)="copyPromoCode(promo.code)"
                            class="copy-btn">
                          </button>
                        </div>
                        <small class="promo-id">ID: {{ promo.id }}</small>
                      </div>
                    </td>
                    <td>
                      <div class="reward-cell">
                        <div class="reward-amount">
                          <i class="pi pi-ticket reward-icon"></i>
                          <span class="tickets-amount">{{ promo.tickets_reward }}</span>
                          <span class="tickets-label">tickets</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="config-cell">
                        <div class="config-item">
                          <i class="pi pi-users config-icon"></i>
                          <span class="config-label">
                            {{ promo.is_single_use_per_user ? 'Usage unique/utilisateur' : 'Usage multiple/utilisateur' }}
                          </span>
                        </div>
                        @if (promo.is_single_use_global) {
                          <div class="config-item">
                            <i class="pi pi-ban config-icon"></i>
                            <span class="config-label">Usage unique global</span>
                          </div>
                        }
                        @if (promo.usage_limit) {
                          <div class="config-item">
                            <i class="pi pi-shield config-icon"></i>
                            <span class="config-label">Limite: {{ promo.usage_limit }} utilisations</span>
                          </div>
                        }
                      </div>
                    </td>
                    <td>
                      <div class="usage-cell">
                        <div class="usage-stats">
                          <div class="usage-numbers">
                            <span class="current-uses">{{ promo.current_uses }}</span>
                            @if (promo.usage_limit) {
                              <span class="usage-separator">/</span>
                              <span class="max-uses">{{ promo.usage_limit }}</span>
                            } @else {
                              <span class="unlimited">∞</span>
                            }
                          </div>
                          @if (promo.usage_limit) {
                            <p-progressBar 
                              [value]="promo.usage_percentage"
                              [showValue]="false"
                              styleClass="usage-progress">
                            </p-progressBar>
                          }
                        </div>
                        @if (promo.remaining_uses > 0 && promo.usage_limit) {
                          <small class="remaining-uses">{{ promo.remaining_uses }} restantes</small>
                        }
                      </div>
                    </td>
                    <td>
                      <div class="status-cell">
                        <p-tag 
                          [value]="getStatusLabel(promo.status)" 
                          [severity]="getStatusSeverity(promo.status)"
                          [icon]="getStatusIcon(promo.status)"
                          styleClass="status-tag animate-pulse">
                        </p-tag>
                      </div>
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
                          [routerLink]="['/promos/detail', promo.id]">
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
                          [routerLink]="['/promos/edit', promo.id]">
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
                          (click)="confirmDelete(promo)">
                        </button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
                
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="6" class="empty-message">
                      <div class="empty-state animate-floating">
                        <i class="pi pi-ticket empty-icon neon-glow"></i>
                        <h3>Aucun code promo trouvé</h3>
                        <p>Aucun code promotionnel ne correspond à vos critères.</p>
                        <button 
                          pButton 
                          pRipple 
                          label="Créer un code" 
                          icon="pi pi-plus"
                          class="gaming-button"
                          routerLink="/promos/new">
                        </button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          } @else {
            <!-- Vue grille -->
            <div class="promos-grid animate-scale-in">
              @for (promo of displayedPromos(); track promo.id; let i = $index) {
                <div class="promo-card-container stagger-fade-in" 
                     [style.animation-delay]="(i * 0.1) + 's'">
                  <p-card styleClass="promo-card gaming-card hover-lift">
                    <ng-template pTemplate="header">
                      <div class="promo-card-header" [class]="'status-' + promo.status">
                        <div class="promo-card-icon">
                          <i class="pi pi-ticket"></i>
                          @if (promo.current_uses > 0) {
                            <p-badge 
                              [value]="promo.current_uses.toString()" 
                              severity="info"
                              styleClass="uses-badge">
                            </p-badge>
                          }
                        </div>
                        <div class="card-title-section">
                          <h3 class="promo-card-title">{{ promo.code }}</h3>
                          <p-tag 
                            [value]="getStatusLabel(promo.status)" 
                            [severity]="getStatusSeverity(promo.status)"
                            [icon]="getStatusIcon(promo.status)"
                            styleClass="status-tag-card">
                          </p-tag>
                        </div>
                      </div>
                    </ng-template>
                    
                    <div class="promo-card-content">
                      <div class="reward-section">
                        <div class="reward-display">
                          <i class="pi pi-gift reward-icon-large"></i>
                          <span class="reward-amount-large">{{ promo.tickets_reward }}</span>
                          <span class="reward-label">tickets offerts</span>
                        </div>
                      </div>
                      
                      <div class="usage-section">
                        <h4 class="section-title">
                          <i class="pi pi-chart-bar"></i>
                          Utilisation
                        </h4>
                        <div class="usage-display">
                          <div class="usage-stats-grid">
                            <span class="usage-current">{{ promo.current_uses }}</span>
                            @if (promo.usage_limit) {
                              <span class="usage-max">/ {{ promo.usage_limit }}</span>
                            } @else {
                              <span class="usage-unlimited">/ ∞</span>
                            }
                          </div>
                          @if (promo.usage_limit) {
                            <p-progressBar 
                              [value]="promo.usage_percentage"
                              [showValue]="false"
                              styleClass="card-usage-progress">
                            </p-progressBar>
                          }
                        </div>
                      </div>
                      
                      <div class="config-section">
                        <h4 class="section-title">
                          <i class="pi pi-cog"></i>
                          Configuration
                        </h4>
                        <div class="config-tags">
                          @if (promo.is_single_use_per_user) {
                            <span class="config-tag user-limit">
                              <i class="pi pi-user"></i>
                              Usage unique/utilisateur
                            </span>
                          }
                          @if (promo.is_single_use_global) {
                            <span class="config-tag global-limit">
                              <i class="pi pi-ban"></i>
                              Usage unique global
                            </span>
                          }
                          @if (promo.usage_limit) {
                            <span class="config-tag usage-limit">
                              <i class="pi pi-shield"></i>
                              Limite: {{ promo.usage_limit }}
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                    
                    <ng-template pTemplate="footer">
                      <div class="promo-card-actions">
                        <button 
                          pButton 
                          pRipple 
                          label="Détails" 
                          icon="pi pi-eye"
                          severity="info"
                          outlined
                          size="small"
                          class="card-action-btn"
                          [routerLink]="['/promos/detail', promo.id]">
                        </button>
                        
                        <button 
                          pButton 
                          pRipple 
                          label="Copier" 
                          icon="pi pi-copy"
                          severity="secondary"
                          outlined
                          size="small"
                          class="card-action-btn"
                          (click)="copyPromoCode(promo.code)">
                        </button>
                        
                        <button 
                          pButton 
                          pRipple 
                          icon="pi pi-pencil"
                          severity="success"
                          outlined
                          size="small"
                          class="card-action-btn"
                          pTooltip="Éditer"
                          [routerLink]="['/promos/edit', promo.id]">
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
  styleUrls: ['./promos-list.component.scss']
})
export class PromosListComponent implements OnInit {
  // Services injectés
  private readonly promosService = inject(PromosService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  // ViewChild
  private readonly table = viewChild<Table>('dt');
  
  // Signaux
  protected readonly loading = signal(false);
  protected readonly promos = signal<PromoCode[]>([]);
  protected readonly viewMode = signal<ViewMode>('table');
  protected readonly searchQuery = signal('');
  protected readonly itemsPerPage = signal(10);
  
  // Computed values
  protected readonly enrichedPromos = computed(() => {
    return this.promos().map(promo => this.enrichPromo(promo));
  });
  
  protected readonly displayedPromos = computed(() => {
    const strategy = PromoViewStrategyFactory.create(this.viewMode());
    return strategy.render(this.filteredPromos());
  });
  
  protected readonly filteredPromos = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const promos = this.enrichedPromos();
    
    if (!query) return promos;
    
    return promos.filter(promo => 
      promo.code.toLowerCase().includes(query) ||
      promo.tickets_reward.toString().includes(query)
    );
  });
  
  protected readonly filteredCount = computed(() => this.filteredPromos().length);
  
  protected readonly promoStats = computed(() => 
    PromoStatsCalculator.calculateStats(this.enrichedPromos())
  );
  
  // Configuration
  protected readonly globalFilterFields = ['code', 'tickets_reward'];

  // Effect pour la recherche
  private readonly searchEffect = effect(() => {
    const query = this.searchQuery();
    this.table()?.filterGlobal(query, 'contains');
  });

  ngOnInit(): void {
    this.loadPromos();
  }

  /**
   * Charge les codes promos
   */
  private loadPromos(): void {
    this.loading.set(true);
    
    this.promosService.getAllPromos().subscribe({
      next: (promos) => {
        this.promos.set(promos);
        this.loading.set(false);
      },
      error: (error) => this.handleError('chargement', error)
    });
  }

  /**
   * Enrichit un code promo avec des métadonnées
   */
  private enrichPromo(promo: PromoCode): EnrichedPromoCode {
    const usagePercentage = this.promosService.calculateUsagePercentage(promo);
    const status = this.promosService.getPromoStatus(promo);
    const remainingUses = promo.usage_limit ? Math.max(0, promo.usage_limit - promo.current_uses) : Infinity;
    const priorityLevel = this.calculatePriorityLevel(promo, status);
    
    return {
      ...promo,
      status,
      usage_percentage: usagePercentage,
      remaining_uses: remainingUses === Infinity ? 0 : remainingUses,
      is_expired: status === 'exhausted',
      priority_level: priorityLevel
    };
  }

  /**
   * Calcule le niveau de priorité d'affichage
   */
  private calculatePriorityLevel(promo: PromoCode, status: PromoStatus): number {
    let priority = 0;
    
    // Plus de tickets = plus de priorité
    priority += promo.tickets_reward * 0.1;
    
    // Status influence la priorité
    switch (status) {
      case 'active': priority += 100; break;
      case 'limited': priority += 80; break;
      case 'single_use': priority += 60; break;
      case 'exhausted': priority += 20; break;
      case 'inactive': priority += 10; break;
    }
    
    // Plus d'utilisations récentes = plus de priorité
    priority += promo.current_uses * 0.5;
    
    return Math.round(priority);
  }

  /**
   * Actualise les promos
   */
  protected refreshPromos(): void {
    this.promosService.clearCache();
    this.loadPromos();
  }

  /**
   * Change le mode d'affichage
   */
  protected setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  /**
   * Gère le filtre de recherche
   */
  protected handleGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  /**
   * Copie un code promo dans le presse-papiers
   */
  protected copyPromoCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Code copié',
        detail: `Le code "${code}" a été copié dans le presse-papiers`,
        life: 3000
      });
    }).catch(() => {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de copier le code',
        life: 3000
      });
    });
  }

  /**
   * Exporte les codes promos
   */
  protected exportPromos(): void {
    this.promosService.exportPromos().subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `codes_promos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Export réussi',
          detail: 'Les codes promos ont été exportés avec succès'
        });
      },
      error: (error:any) => this.handleError('export', error)
    });
  }

  /**
   * Gère le clic sur une statistique
   */
  protected handleStatClick(statData: StatsData): void {
    console.log('Stat clicked:', statData);
  }

  /**
   * Confirme la suppression d'un code
   */
  protected confirmDelete(promo: EnrichedPromoCode): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer le code "${promo.code}" ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => this.executeDelete(promo.id)
    });
  }

  /**
   * Exécute la suppression
   */
  private executeDelete(id: number): void {
    this.promosService.deletePromo(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Code promo supprimé avec succès'
        });
        this.refreshPromos();
      },
      error: (error: any) => this.handleError('suppression', error)
    });
  }

  /**
   * Gestion des erreurs
   */
  private handleError(operation: string, error: any): void {
    console.error(`Erreur lors du ${operation}:`, error);
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || `Impossible de ${operation === 'chargement' ? 'charger les données' : 'effectuer l\'opération'}`
    });
    this.loading.set(false);
  }

  // Méthodes utilitaires pour l'affichage
  protected getStatusLabel(status: PromoStatus): string {
    const labels = {
      active: 'Actif',
      exhausted: 'Épuisé',
      limited: 'Limité', 
      single_use: 'Usage unique',
      inactive: 'Inactif'
    };
    return labels[status];
  }

  protected getStatusSeverity(status: PromoStatus): 'success' | 'warning' | 'danger' | 'info' {
    const severities = {
      active: 'success' as const,
      limited: 'warning' as const,
      exhausted: 'danger' as const,
      single_use: 'info' as const,
      inactive: 'danger' as const
    };
    return severities[status];
  }

  protected getStatusIcon(status: PromoStatus): string {
    const icons = {
      active: 'pi-check-circle',
      limited: 'pi-exclamation-triangle',
      exhausted: 'pi-times-circle',
      single_use: 'pi-user',
      inactive: 'pi-ban'
    };
    return icons[status];
  }
}