// src/app/features/users/pages/users-list/users-list.component.ts

import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { UsersService } from '../../../../core/services/users.service';
import { User } from '../../../../core/models/user.model';
import { StatsCardComponent } from '../../../../shared/components/stats-card/stats-card.component';

/**
 * Interface pour les filtres de la liste
 */
interface UserFilters {
  readonly search: string;
  readonly status: 'all' | 'active' | 'inactive';
  readonly barAccess: 'all' | 'yes' | 'no';
  readonly sortField: string;
  readonly sortOrder: 'asc' | 'desc';
}

/**
 * Interface pour les statistiques des utilisateurs
 */
interface UserStats {
  readonly total: number;
  readonly active: number;
  readonly withBarAccess: number;
  readonly averageTickets: number;
}

/**
 * Type pour les actions en lot
 */
type BulkAction = 'delete' | 'activate' | 'deactivate' | 'grantBar' | 'revokeBar';

/**
 * Composant moderne de liste d'utilisateurs
 * Utilise les nouvelles fonctionnalités d'Angular 19
 */
@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    ButtonModule,
    RippleModule,
    InputTextModule,
    DropdownModule,
    MultiSelectModule,
    TagModule,
    AvatarModule,
    ProgressBarModule,
    TooltipModule,
    ConfirmDialogModule,
    StatsCardComponent
  ],
  providers: [ConfirmationService],
  template: `
    <div class="users-page animate-fade-in">
      <!-- Header avec statistiques -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title arcade-title">Gestion des Utilisateurs</h1>
          <p class="page-subtitle">
            Gérez les comptes utilisateurs et leurs permissions
          </p>
        </div>
        
        <div class="header-actions">
          <button 
            pButton 
            pRipple 
            icon="pi pi-refresh" 
            label="Actualiser"
            class="p-button-outlined"
            (click)="refreshData()"
            [loading]="isLoading()"
            pTooltip="Ctrl+R">
          </button>
          
          <button 
            pButton 
            pRipple 
            icon="pi pi-plus" 
            label="Nouvel utilisateur"
            class="p-button-success arcade-button"
            routerLink="/users/new">
          </button>
        </div>
      </div>

      <!-- Cartes de statistiques -->
      <div class="stats-grid stagger-fade-in">
        <app-stats-card
          [data]="{
            title: 'Total utilisateurs',
            value: stats().total,
            icon: 'pi-users',
            color: 'primary',
            trend: { value: 12, direction: 'up', period: 'ce mois' }
          }"
          [clickable]="true"
          [animated]="true"
          (cardClick)="onStatsCardClick('total')">
        </app-stats-card>

        <app-stats-card
          [data]="{
            title: 'Utilisateurs actifs',
            value: stats().active,
            icon: 'pi-check-circle',
            color: 'success',
            trend: { value: 8, direction: 'up', period: 'cette semaine' }
          }"
          [clickable]="true"
          [gamingStyle]="true">
        </app-stats-card>

        <app-stats-card
          [data]="{
            title: 'Accès bar',
            value: stats().withBarAccess,
            icon: 'pi-star',
            color: 'warning',
            subtitle: 'utilisateurs VIP'
          }"
          [clickable]="true">
        </app-stats-card>

        <app-stats-card
          [data]="{
            title: 'Tickets moyens',
            value: stats().averageTickets,
            icon: 'pi-ticket',
            color: 'info',
            trend: { value: 5, direction: 'down', period: 'vs hier' }
          }"
          [animated]="true">
        </app-stats-card>
      </div>

      <!-- Contrôles et filtres -->
      <div class="controls-section gaming-card-glow">
        <div class="search-and-filters">
          <!-- Recherche -->
          <div class="search-container">
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <input 
                pInputText 
                type="text" 
                [value]="filters().search"
                (input)="onSearchChange($event)"
                placeholder="Rechercher par nom, email, ID..."
                class="search-input" />
            </span>
            @if (filters().search) {
              <button 
                class="clear-search"
                (click)="clearSearch()"
                pTooltip="Effacer la recherche">
                <i class="pi pi-times"></i>
              </button>
            }
          </div>

          <!-- Filtres -->
          <div class="filters-container">
            <p-dropdown
              [options]="statusOptions"
              [value]="filters().status"
              (onChange)="updateFilter('status', $event.value)"
              placeholder="Statut"
              styleClass="filter-dropdown">
            </p-dropdown>

            <p-dropdown
              [options]="barAccessOptions"
              [value]="filters().barAccess"
              (onChange)="updateFilter('barAccess', $event.value)"
              placeholder="Accès bar"
              styleClass="filter-dropdown">
            </p-dropdown>
          </div>
        </div>

        <!-- Actions en lot -->
        @if (selectedUsers().length > 0) {
          <div class="bulk-actions animate-slide-in-right">
            <span class="selection-count">
              {{ selectedUsers().length }} utilisateur(s) sélectionné(s)
            </span>
            
            <div class="bulk-buttons">
              <button 
                pButton 
                pRipple 
                icon="pi pi-check"
                label="Activer"
                class="p-button-success p-button-sm"
                (click)="executeBulkAction('activate')"
                pTooltip="Activer les utilisateurs sélectionnés">
              </button>
              
              <button 
                pButton 
                pRipple 
                icon="pi pi-times"
                label="Désactiver"
                class="p-button-warning p-button-sm"
                (click)="executeBulkAction('deactivate')"
                pTooltip="Désactiver les utilisateurs sélectionnés">
              </button>
              
              <button 
                pButton 
                pRipple 
                icon="pi pi-trash"
                label="Supprimer"
                class="p-button-danger p-button-sm"
                (click)="executeBulkAction('delete')"
                pTooltip="Supprimer les utilisateurs sélectionnés">
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Table des utilisateurs -->
      <div class="table-container gaming-card-glow">
        <p-table 
          #dt
          [value]="filteredUsers()"
          [rows]="20"
          [paginator]="true"
          [loading]="isLoading()"
          [rowHover]="true"
          [showCurrentPageReport]="true"
          [globalFilterFields]="['first_name', 'last_name', 'publique_id', 'firebase_id']"
          [scrollable]="true"
          scrollHeight="600px"
          dataKey="id"
          selectionMode="multiple"
          [(selection)]="selectedUsersArray"
          (selectionChange)="onSelectionChange($event)"
          currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} utilisateurs"
          styleClass="modern-table">
          
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 3rem">
                <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
              </th>
              <th pSortableColumn="first_name" style="min-width: 200px">
                Utilisateur
                <p-sortIcon field="first_name"></p-sortIcon>
              </th>
              <th pSortableColumn="publique_id" style="min-width: 120px">
                ID Public
                <p-sortIcon field="publique_id"></p-sortIcon>
              </th>
              <th pSortableColumn="nb_ticket" style="min-width: 100px">
                Tickets
                <p-sortIcon field="nb_ticket"></p-sortIcon>
              </th>
              <th pSortableColumn="bar" style="min-width: 100px">
                Bar
                <p-sortIcon field="bar"></p-sortIcon>
              </th>
              <th pSortableColumn="created_at" style="min-width: 130px">
                Inscription
                <p-sortIcon field="created_at"></p-sortIcon>
              </th>
              <th style="min-width: 120px">Actions</th>
            </tr>
          </ng-template>
          
          <ng-template pTemplate="body" let-user let-index="rowIndex">
            <tr [class]="getRowClass(user)">
              <td>
                <p-tableCheckbox [value]="user"></p-tableCheckbox>
              </td>
              
              <td>
                <div class="user-info">
                  <p-avatar 
                    [label]="getUserInitials(user)"
                    [style]="{ 'background-color': getUserAvatarColor(user) }"
                    styleClass="user-avatar">
                  </p-avatar>
                  <div class="user-details">
                    <span class="user-name">
                      {{ user.first_name || 'Prénom' }} {{ user.last_name || 'Nom' }}
                    </span>
                    <span class="user-id">{{ user.firebase_id }}</span>
                  </div>
                  @if (isUserOnline(user)) {
                    <span class="status-indicator online" pTooltip="En ligne"></span>
                  }
                </div>
              </td>
              
              <td>
                <code class="public-id">{{ user.publique_id }}</code>
              </td>
              
              <td>
                <div class="tickets-display">
                  <span [class]="getTicketsClass(user.nb_ticket)">
                    {{ user.nb_ticket }}
                  </span>
                  <p-progressBar 
                    [value]="getTicketsPercentage(user.nb_ticket)"
                    [showValue]="false"
                    styleClass="tickets-progress">
                  </p-progressBar>
                </div>
              </td>
              
              <td>
                <p-tag 
                  [value]="user.bar ? 'Autorisé' : 'Non autorisé'"
                  [severity]="user.bar ? 'success' : 'secondary'"
                  [icon]="user.bar ? 'pi pi-check' : 'pi pi-times'">
                </p-tag>
              </td>
              
              <td>
                <span class="date-display" [pTooltip]="getFullDate(user.created_at)">
                  {{ getRelativeDate(user.created_at) }}
                </span>
              </td>
              
              <td>
                <div class="action-buttons">
                  <button 
                    pButton 
                    pRipple 
                    icon="pi pi-eye"
                    class="p-button-rounded p-button-text p-button-info action-btn"
                    [routerLink]="['/users', user.id]"
                    pTooltip="Voir le profil">
                  </button>
                  
                  <button 
                    pButton 
                    pRipple 
                    icon="pi pi-pencil"
                    class="p-button-rounded p-button-text p-button-success action-btn"
                    [routerLink]="['/users/edit', user.id]"
                    pTooltip="Modifier">
                  </button>
                  
                  <button 
                    pButton 
                    pRipple 
                    icon="pi pi-trash"
                    class="p-button-rounded p-button-text p-button-danger action-btn"
                    (click)="confirmDeleteUser(user)"
                    pTooltip="Supprimer">
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="empty-state">
                <div class="empty-content">
                  <i class="pi pi-users empty-icon"></i>
                  <h3>Aucun utilisateur trouvé</h3>
                  <p>Aucun utilisateur ne correspond à vos critères de recherche.</p>
                  @if (filters().search || filters().status !== 'all') {
                    <button 
                      pButton 
                      label="Effacer les filtres"
                      class="p-button-text"
                      (click)="clearAllFilters()">
                    </button>
                  }
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Dialog de confirmation -->
    <p-confirmDialog 
      header="Confirmation" 
      icon="pi pi-exclamation-triangle"
      acceptButtonStyleClass="p-button-danger"
      acceptLabel="Confirmer"
      rejectLabel="Annuler">
    </p-confirmDialog>
  `,
  styles: [`
    .users-page {
      @apply flex flex-col gap-6 p-6;
      min-height: 100vh;
      background: var(--surface-ground);
    }

    .page-header {
      @apply flex justify-between items-start;
      
      .header-content {
        .page-title {
          @apply text-3xl font-bold mb-2;
          margin: 0;
        }
        
        .page-subtitle {
          @apply text-lg;
          color: var(--text-color-secondary);
          margin: 0;
        }
      }
      
      .header-actions {
        @apply flex gap-3;
      }
    }

    .stats-grid {
      @apply grid gap-6;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    .controls-section {
      @apply p-6 rounded-xl;
      
      .search-and-filters {
        @apply flex justify-between items-center mb-4;
        
        .search-container {
          @apply relative flex-1 max-w-md;
          
          .search-input {
            @apply w-full;
            padding-right: 40px;
          }
          
          .clear-search {
            @apply absolute right-2 top-1/2 transform -translate-y-1/2;
            @apply p-2 rounded border-0 bg-transparent;
            color: var(--text-color-secondary);
            cursor: pointer;
            
            &:hover {
              background: var(--surface-hover);
            }
          }
        }
        
        .filters-container {
          @apply flex gap-3;
          
          .filter-dropdown {
            min-width: 150px;
          }
        }
      }
      
      .bulk-actions {
        @apply flex justify-between items-center p-4 rounded-lg;
        background: var(--surface-section);
        border: 1px solid var(--surface-border);
        
        .selection-count {
          @apply font-medium;
          color: var(--text-color);
        }
        
        .bulk-buttons {
          @apply flex gap-2;
        }
      }
    }

    .table-container {
      @apply rounded-xl overflow-hidden;
      
      :host ::ng-deep .modern-table {
        .p-datatable-header {
          background: var(--surface-section);
          border: none;
          padding: 1.5rem;
        }
        
        .p-datatable-thead > tr > th {
          background: var(--surface-card);
          color: var(--text-color);
          font-weight: 600;
          padding: 1rem;
          border-color: var(--surface-border);
        }
        
        .p-datatable-tbody > tr {
          &:hover {
            background: var(--surface-hover);
          }
          
          &.user-inactive {
            opacity: 0.6;
          }
          
          > td {
            padding: 1rem;
            border-color: var(--surface-border);
          }
        }
        
        .p-paginator {
          background: var(--surface-card);
          border: none;
          padding: 1rem;
        }
      }
    }

    .user-info {
      @apply flex items-center gap-3 relative;
      
      .user-avatar {
        width: 40px;
        height: 40px;
        font-weight: 600;
      }
      
      .user-details {
        @apply flex flex-col;
        
        .user-name {
          @apply font-medium text-sm;
          color: var(--text-color);
        }
        
        .user-id {
          @apply text-xs;
          color: var(--text-color-secondary);
          font-family: monospace;
        }
      }
      
      .status-indicator {
        @apply absolute -top-1 -right-1 w-3 h-3 rounded-full;
        
        &.online {
          background: var(--neon-green);
          box-shadow: 0 0 0 2px var(--surface-card);
          animation: pulse 2s infinite;
        }
      }
    }

    .public-id {
      @apply text-xs font-mono px-2 py-1 rounded;
      background: var(--surface-section);
      color: var(--text-color);
      border: 1px solid var(--surface-border);
    }

    .tickets-display {
      @apply flex flex-col gap-1;
      
      .tickets-count {
        @apply font-semibold text-center;
        
        &.low { color: var(--arcade-red); }
        &.medium { color: var(--neon-orange); }
        &.high { color: var(--neon-green); }
      }
      
      :host ::ng-deep .tickets-progress {
        height: 4px;
        
        .p-progressbar-value {
          background: var(--gaming-gradient-primary);
        }
      }
    }

    .date-display {
      @apply text-sm;
      color: var(--text-color-secondary);
    }

    .action-buttons {
      @apply flex gap-1;
      
      .action-btn {
        @apply hover-scale;
        width: 32px;
        height: 32px;
      }
    }

    .empty-state {
      @apply text-center py-12;
      
      .empty-content {
        @apply flex flex-col items-center gap-4;
        
        .empty-icon {
          @apply text-6xl;
          color: var(--text-color-muted);
        }
        
        h3 {
          @apply text-xl font-semibold m-0;
          color: var(--text-color);
        }
        
        p {
          @apply m-0;
          color: var(--text-color-secondary);
        }
      }
    }

    // Responsive
    @media (max-width: 768px) {
      .users-page {
        @apply p-4 gap-4;
      }
      
      .page-header {
        @apply flex-col gap-4;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .search-and-filters {
        @apply flex-col gap-4 items-stretch;
      }
    }
  `]
})
export class UsersListComponent {
  // Services injectés
  private readonly usersService = inject(UsersService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  // Référence à la table
  protected readonly table = viewChild<Table>('dt');

  // État du composant
  protected readonly isLoading = signal(false);
  protected readonly users = signal<readonly User[]>([]);
  protected readonly selectedUsers = signal<readonly User[]>([]);
  
  // Filtres
  protected readonly filters = signal<UserFilters>({
    search: '',
    status: 'all',
    barAccess: 'all',
    sortField: 'created_at',
    sortOrder: 'desc'
  });

  // Options pour les dropdowns
  protected readonly statusOptions = [
    { label: 'Tous les statuts', value: 'all' },
    { label: 'Actifs', value: 'active' },
    { label: 'Inactifs', value: 'inactive' }
  ];

  protected readonly barAccessOptions = [
    { label: 'Tous', value: 'all' },
    { label: 'Accès autorisé', value: 'yes' },
    { label: 'Accès refusé', value: 'no' }
  ];

  // Subject pour la recherche avec debounce
  private readonly searchSubject = new Subject<string>();

  // Array pour la sélection (compatibility avec PrimeNG)
  protected selectedUsersArray: User[] = [];

  /**
   * Utilisateurs filtrés calculés
   */
  protected readonly filteredUsers = computed(() => {
    const users = this.users();
    const filters = this.filters();
    
    return users.filter(user => {
      // Filtre de recherche
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          user.first_name,
          user.last_name,
          user.publique_id,
          user.firebase_id
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }
      
      // Filtre de statut (simulé)
      if (filters.status !== 'all') {
        const isActive = this.isUserActive(user);
        if (filters.status === 'active' && !isActive) return false;
        if (filters.status === 'inactive' && isActive) return false;
      }
      
      // Filtre d'accès bar
      if (filters.barAccess !== 'all') {
        if (filters.barAccess === 'yes' && !user.bar) return false;
        if (filters.barAccess === 'no' && user.bar) return false;
      }
      
      return true;
    });
  });

  /**
   * Statistiques calculées
   */
  protected readonly stats = computed((): UserStats => {
    const users = this.users();
    const active = users.filter(u => this.isUserActive(u)).length;
    const withBarAccess = users.filter(u => u.bar).length;
    const totalTickets = users.reduce((sum, u) => sum + u.nb_ticket, 0);
    
    return {
      total: users.length,
      active,
      withBarAccess,
      averageTickets: users.length > 0 ? Math.round(totalTickets / users.length) : 0
    };
  });

  constructor() {
    this.setupSearchDebounce();
    this.loadUsers();
    
    // Effect pour synchroniser la sélection
    effect(() => {
      this.selectedUsersArray = [...this.selectedUsers()];
    });
  }

  /**
   * Configure le debounce pour la recherche
   */
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(search => {
      this.updateFilter('search', search);
    });
  }

  /**
   * Charge les utilisateurs
   */
  protected async loadUsers(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      const users = await this.usersService.getAllUsers().toPromise();
      this.users.set(users || []);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de charger les utilisateurs'
      });
      console.error('Error loading users:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Met à jour un filtre
   */
  protected updateFilter<K extends keyof UserFilters>(
    key: K, 
    value: UserFilters[K]
  ): void {
    this.filters.update(current => ({
      ...current,
      [key]: value
    }));
  }

  /**
   * Gère le changement de recherche
   */
  protected onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  /**
   * Efface la recherche
   */
  protected clearSearch(): void {
    this.updateFilter('search', '');
  }

  /**
   * Efface tous les filtres
   */
  protected clearAllFilters(): void {
    this.filters.set({
      search: '',
      status: 'all',
      barAccess: 'all',
      sortField: 'created_at',
      sortOrder: 'desc'
    });
  }

  /**
   * Actualise les données
   */
  protected refreshData(): void {
    this.loadUsers();
  }

  /**
   * Gère le changement de sélection
   */
  protected onSelectionChange(event: User[]): void {
    this.selectedUsers.set(event);
  }

  /**
   * Gère le clic sur une carte de stats
   */
  protected onStatsCardClick(type: string): void {
    switch (type) {
      case 'total':
        this.clearAllFilters();
        break;
      case 'active':
        this.updateFilter('status', 'active');
        break;
      case 'withBar':
        this.updateFilter('barAccess', 'yes');
        break;
    }
  }

  /**
   * Confirme la suppression d'un utilisateur
   */
  protected confirmDeleteUser(user: User): void {
    this.confirmationService.confirm({
      message: `Voulez-vous vraiment supprimer l'utilisateur "${user.first_name} ${user.last_name}" ?`,
      accept: () => this.deleteUser(user)
    });
  }

  /**
   * Supprime un utilisateur
   */
  private async deleteUser(user: User): Promise<void> {
    try {
      await this.usersService.deleteUser(user.firebase_id).toPromise();
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Utilisateur supprimé'
      });
      this.loadUsers();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de supprimer l\'utilisateur'
      });
    }
  }

  /**
   * Exécute une action en lot
   */
  protected executeBulkAction(action: BulkAction): void {
    const count = this.selectedUsers().length;
    const message = this.getBulkActionMessage(action, count);
    
    this.confirmationService.confirm({
      message,
      accept: () => this.performBulkAction(action)
    });
  }

  /**
   * Retourne le message pour une action en lot
   */
  private getBulkActionMessage(action: BulkAction, count: number): string {
    const messages = {
      delete: `Supprimer ${count} utilisateur(s) ?`,
      activate: `Activer ${count} utilisateur(s) ?`,
      deactivate: `Désactiver ${count} utilisateur(s) ?`,
      grantBar: `Autoriser l'accès bar pour ${count} utilisateur(s) ?`,
      revokeBar: `Révoquer l'accès bar pour ${count} utilisateur(s) ?`
    };
    
    return messages[action];
  }

  /**
   * Effectue l'action en lot
   */
  private async performBulkAction(action: BulkAction): Promise<void> {
    // Ici, vous implémenteriez les actions en lot
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: `Action "${action}" effectuée sur ${this.selectedUsers().length} utilisateur(s)`
    });
    
    this.selectedUsers.set([]);
    this.loadUsers();
  }

  // Méthodes utilitaires
  protected isUserActive(user: User): boolean {
    // Logique pour déterminer si un utilisateur est actif
    return !user.is_deleted;
  }

  protected isUserOnline(user: User): boolean {
    // Simulation - dans un vrai projet, cette info viendrait d'un service temps réel
    return Math.random() > 0.7;
  }

  protected getUserInitials(user: User): string {
    return [user.first_name, user.last_name]
      .filter(Boolean)
      .map(name => name?.charAt(0))
      .join('')
      .toUpperCase() || 'U';
  }

  protected getUserAvatarColor(user: User): string {
    const colors = [
      'var(--primary-500)',
      'var(--neon-blue)',
      'var(--neon-purple)',
      'var(--neon-green)',
      'var(--neon-orange)'
    ];
    
    const index = user.publique_id.charCodeAt(0) % colors.length;
    return colors[index];
  }

  protected getRowClass(user: User): string {
    return this.isUserActive(user) ? '' : 'user-inactive';
  }

  protected getTicketsClass(tickets: number): string {
    const baseClass = 'tickets-count';
    if (tickets < 5) return `${baseClass} low`;
    if (tickets < 20) return `${baseClass} medium`;
    return `${baseClass} high`;
  }

  protected getTicketsPercentage(tickets: number): number {
    const max = Math.max(...this.users().map(u => u.nb_ticket), 50);
    return (tickets / max) * 100;
  }

  protected getRelativeDate(date: Date | string): string {
    const now = new Date();
    const targetDate = new Date(date);
    const diffTime = now.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    
    return targetDate.toLocaleDateString('fr-FR');
  }

  protected getFullDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}