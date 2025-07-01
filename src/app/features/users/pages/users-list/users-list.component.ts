// src/app/features/users/pages/users-list/users-list.component.ts

import { Component, OnInit, inject, signal, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UsersService } from '../../../../core/services/users.service';
import { User } from '../../../../core/models/user.model';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-users-list',
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
    LoaderComponent
  ],
  providers: [ConfirmationService],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1><i class="pi pi-users"></i> Utilisateurs</h1>
        <div class="page-actions">
          <p-button 
            icon="pi pi-refresh" 
            label="Actualiser" 
            [loading]="loading()"
            (click)="refreshUsers()"
            severity="secondary"
            outlined>
          </p-button>
        </div>
      </div>
      
      <div class="page-content">
        @if (loading()) {
          <app-loader size="large">Chargement des utilisateurs...</app-loader>
        } @else {
          <div class="search-container">
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <input 
                pInputText 
                type="text" 
                placeholder="Rechercher par nom, prénom ou pseudo..." 
                (input)="applyFilterGlobal($event)" />
            </span>
            <div class="search-stats">
              {{ filteredUsers().length }} utilisateur(s) trouvé(s)
            </div>
          </div>
          
          <p-table 
            #dt 
            [value]="filteredUsers()" 
            [rows]="itemsPerPage()" 
            [paginator]="true" 
            [globalFilterFields]="globalFilterFields"
            [tableStyle]="{'min-width': '75rem'}"
            [rowHover]="true" 
            dataKey="id"
            [showCurrentPageReport]="true" 
            currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} utilisateurs"
            [rowsPerPageOptions]="[10, 25, 50]"
            styleClass="users-table">
            
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="nom" style="width: 20%">
                  Nom <p-sortIcon field="nom"></p-sortIcon>
                </th>
                <th pSortableColumn="prenom" style="width: 20%">
                  Prénom <p-sortIcon field="prenom"></p-sortIcon>
                </th>
                <th pSortableColumn="pseudo" style="width: 20%">
                  Pseudo <p-sortIcon field="pseudo"></p-sortIcon>
                </th>
                <th pSortableColumn="tickets_balance" style="width: 15%">
                  Tickets <p-sortIcon field="tickets_balance"></p-sortIcon>
                </th>
                <th pSortableColumn="created_at" style="width: 15%">
                  Inscription <p-sortIcon field="created_at"></p-sortIcon>
                </th>
                <th style="width: 10%">Actions</th>
              </tr>
            </ng-template>
            
            <ng-template pTemplate="body" let-user>
              <tr>
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">
                      {{ getUserInitials(user) }}
                    </div>
                    <span class="user-name">{{ user.nom || 'Non défini' }}</span>
                  </div>
                </td>
                <td>{{ user.prenom || 'Non défini' }}</td>
                <td>
                  <span class="user-pseudo">{{ user.pseudo }}</span>
                </td>
                <td>
                  <p-tag 
                    [value]="user.tickets_balance.toString()" 
                    [severity]="getTicketsSeverity(user.tickets_balance)"
                    icon="pi pi-ticket">
                  </p-tag>
                </td>
                <td>
                  <span class="date-cell">{{ formatDate(user.created_at) }}</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <p-button 
                      icon="pi pi-eye" 
                      [rounded]="true"
                      text
                      severity="info"
                      size="small"
                      pTooltip="Voir le profil" 
                      tooltipPosition="top"
                      [routerLink]="['/users', user.id]">
                    </p-button>
                    
                    <p-button 
                      icon="pi pi-pencil" 
                      [rounded]="true"
                      text
                      severity="success"
                      size="small"
                      pTooltip="Éditer" 
                      tooltipPosition="top"
                      [routerLink]="['/users/edit', user.id]">
                    </p-button>
                    
                    <p-button 
                      icon="pi pi-trash" 
                      [rounded]="true"
                      text
                      severity="danger"
                      size="small"
                      pTooltip="Supprimer" 
                      tooltipPosition="top"
                      (click)="confirmDelete(user)">
                    </p-button>
                  </div>
                </td>
              </tr>
            </ng-template>
            
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6" class="empty-message">
                  <div class="empty-state">
                    <i class="pi pi-users empty-icon"></i>
                    <h3>Aucun utilisateur trouvé</h3>
                    <p>Aucun utilisateur ne correspond à vos critères de recherche.</p>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </div>
    </div>
    
    <p-confirmDialog 
      header="Confirmation de suppression"
      icon="pi pi-exclamation-triangle"
      [blockScroll]="true">
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
    
    .search-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
      
      .p-input-icon-left {
        flex: 1;
        max-width: 400px;
        
        input {
          width: 100%;
          padding-left: var(--space-10);
        }
      }
      
      .search-stats {
        color: var(--text-color-secondary);
        font-size: var(--text-sm);
        font-weight: 500;
      }
    }
    
    .user-cell {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      
      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-full);
        background: var(--gradient-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: var(--text-sm);
        text-transform: uppercase;
      }
      
      .user-name {
        font-weight: 500;
        color: var(--text-color);
      }
    }
    
    .user-pseudo {
      font-family: var(--font-family-mono);
      background: var(--surface-hover);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
    }
    
    .date-cell {
      color: var(--text-color-secondary);
      font-size: var(--text-sm);
    }
    
    .action-buttons {
      display: flex;
      gap: var(--space-1);
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
        margin: 0;
        color: var(--text-color-secondary);
      }
    }
    
    :host ::ng-deep {
      .users-table {
        .p-datatable-thead > tr > th {
          background: var(--surface-ground);
          border-bottom: 2px solid var(--surface-border);
          font-weight: 600;
          color: var(--text-color);
        }
        
        .p-datatable-tbody > tr {
          transition: all var(--transition-fast);
          
          &:hover {
            background: var(--surface-hover);
            transform: translateY(-1px);
            box-shadow: var(--shadow-sm);
          }
        }
        
        .p-tag {
          font-weight: 600;
        }
      }
    }
    
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-4);
      }
      
      .search-container {
        flex-direction: column;
        gap: var(--space-3);
        
        .p-input-icon-left {
          max-width: none;
        }
      }
    }
  `]
})
export class UsersListComponent implements OnInit {
  // Services injectés
  private readonly usersService = inject(UsersService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  // ViewChild pour la table
  readonly table = viewChild<Table>('dt');
  
  // Signals pour l'état du composant
  readonly users = signal<User[]>([]);
  readonly filteredUsers = signal<User[]>([]);
  readonly loading = signal(true);
  readonly searchQuery = signal('');
  readonly itemsPerPage = signal(10);
  
  // Configuration de la table
  readonly globalFilterFields = ['nom', 'prenom', 'pseudo', 'email'];
  
  // Effect pour filtrer les utilisateurs quand la recherche change
  private readonly filterEffect = effect(() => {
    const query = this.searchQuery().toLowerCase();
    const allUsers = this.users();
    
    if (!query) {
      this.filteredUsers.set(allUsers);
      return;
    }
    
    const filtered = allUsers.filter(user => 
      user.nom?.toLowerCase().includes(query) ||
      user.prenom?.toLowerCase().includes(query) ||
      user.pseudo?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
    
    this.filteredUsers.set(filtered);
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Charge la liste des utilisateurs
   */
  private loadUsers(): void {
    this.loading.set(true);
    
    this.usersService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.filteredUsers.set(users);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les utilisateurs'
        });
        this.loading.set(false);
      }
    });
  }

  /**
   * Actualise la liste des utilisateurs
   */
  refreshUsers(): void {
    this.usersService.clearCache();
    this.loadUsers();
  }

  /**
   * Applique un filtre global sur la table
   */
  applyFilterGlobal(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  /**
   * Confirme la suppression d'un utilisateur
   */
  confirmDelete(user: User): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.prenom} ${user.nom}" (${user.pseudo}) ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => this.deleteUser(user.firebase_uid)
    });
  }

  /**
   * Supprime un utilisateur
   */
  private deleteUser(userId: string): void {
    this.usersService.deleteUser(userId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Utilisateur supprimé avec succès'
        });
        this.loadUsers();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de supprimer l\'utilisateur'
        });
      }
    });
  }

  /**
   * Retourne les initiales d'un utilisateur
   */
  getUserInitials(user: User): string {
    const firstName = user.prenom?.charAt(0)?.toUpperCase() || '';
    const lastName = user.nom?.charAt(0)?.toUpperCase() || '';
    return `${firstName}${lastName}` || user.pseudo?.charAt(0)?.toUpperCase() || '?';
  }

  /**
   * Détermine la sévérité du tag tickets
   */
  getTicketsSeverity(balance: number): 'success' | 'warning' | 'danger' | 'info' {
    if (balance >= 50) return 'success';
    if (balance >= 10) return 'info';
    if (balance >= 1) return 'warning';
    return 'danger';
  }

  /**
   * Formate une date
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }
}