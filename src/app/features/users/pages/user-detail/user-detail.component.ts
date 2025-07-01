import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { UsersService } from '../../../../core/services/users.service';
import { PartiesService } from '../../../../core/services/parties.service';
import { User } from '../../../../core/models/user.model';
import { Party } from '../../../../core/models/party.model';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

interface UserStats {
  totalParties: number;
  victories: number;
  defeats: number;
  winRate: number;
  totalTicketsUsed: number;
  favoriteGame?: string;
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    TabViewModule,
    TableModule,
    RippleModule,
    DividerModule,
    ChipModule,
    ConfirmDialogModule,
    LoaderComponent
  ],
  providers: [ConfirmationService],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Détails de l'utilisateur</h1>
        <div class="page-actions">
          <button pButton pRipple type="button" icon="pi pi-arrow-left" 
                  label="Retour" class="p-button-text" routerLink="/users"></button>
        </div>
      </div>
      
      <app-loader *ngIf="loading" size="large" [fullScreen]="true"></app-loader>
      
      <div class="user-detail-content" *ngIf="!loading && user">
        <!-- Informations principales -->
        <p-card styleClass="user-info-card">
          <div class="user-header">
            <div class="user-avatar">
              <i class="pi pi-user"></i>
            </div>
            <div class="user-identity">
              <h2>{{ user.nom || 'Prénom non défini' }} {{ user.prenom || 'Nom non défini' }}</h2>
              <p class="user-id">ID Public: <strong>{{ user.firebase_uid }}</strong></p>
            </div>
            <div class="user-actions">
              <button pButton pRipple type="button" icon="pi pi-pencil" 
                      label="Modifier" class="p-button-success"
                      [routerLink]="['/users/edit', user.id]"></button>
              <button pButton pRipple type="button" icon="pi pi-trash" 
                      label="Supprimer" class="p-button-danger p-button-outlined"
                      (click)="confirmDelete()"></button>
            </div>
          </div>
          
          <p-divider></p-divider>
          
          <div class="user-details-grid">
            <div class="detail-item">
              <label>Firebase ID</label>
              <p>{{ user.firebase_uid }}</p>
            </div>
            <div class="detail-item">
              <label>Tickets disponibles</label>
              <p-chip [label]="user.tickets_balance.toString()" styleClass="custom-chip-primary"></p-chip>
            </div>
            <!-- <div class="detail-item">
              <label>Accès bar</label>
              <p-tag [severity]="user.bar ? 'success' : 'danger'" 
                     [value]="user.bar ? 'Autorisé' : 'Non autorisé'"></p-tag>
            </div> -->
            <div class="detail-item">
              <label>Date de création</label>
              <p>{{ formatDate(user.created_at) }}</p>
            </div>
          </div>
        </p-card>
        
        <!-- Statistiques -->
        <p-card styleClass="stats-card" header="Statistiques">
          <div class="stats-grid">
            <div class="stat-item">
              <i class="pi pi-ticket stat-icon"></i>
              <div class="stat-content">
                <h3>{{ stats.totalParties }}</h3>
                <p>Parties jouées</p>
              </div>
            </div>
            <div class="stat-item">
              <i class="pi pi-trophy stat-icon text-green-500"></i>
              <div class="stat-content">
                <h3>{{ stats.victories }}</h3>
                <p>Victoires</p>
              </div>
            </div>
            <div class="stat-item">
              <i class="pi pi-times-circle stat-icon text-red-500"></i>
              <div class="stat-content">
                <h3>{{ stats.defeats }}</h3>
                <p>Défaites</p>
              </div>
            </div>
            <div class="stat-item">
              <i class="pi pi-percentage stat-icon text-blue-500"></i>
              <div class="stat-content">
                <h3>{{ stats.winRate }}%</h3>
                <p>Taux de victoire</p>
              </div>
            </div>
          </div>
        </p-card>
        
        <!-- Historique des parties -->
        <p-card styleClass="history-card">
          <ng-template pTemplate="header">
            <div class="card-header-custom">
              <h3>Historique des parties</h3>
              <p-tag [value]="userParties.length + ' parties'" severity="info"></p-tag>
            </div>
          </ng-template>
          
          <p-table [value]="userParties" [rows]="10" [paginator]="true"
                   [rowHover]="true" [tableStyle]="{'min-width': '50rem'}"
                   [showCurrentPageReport]="true"
                   currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} parties">
            <ng-template pTemplate="header">
              <tr>
                <th>Date</th>
                <th>Jeu</th>
                <th>Adversaire</th>
                <th>Score</th>
                <th>Résultat</th>
                <th>Statut</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-party>
              <tr>
                <td>{{ formatDate(party.created_at) }}</td>
                <td>{{ getGameName(party.game_id) }}</td>
                <td>{{ getOpponentName(party) }}</td>
                <td>
                  <span class="score">
                    {{ getUserScore(party) }} - {{ getOpponentScore(party) }}
                  </span>
                </td>
                <td>
                  <p-tag [severity]="getResultSeverity(party)" 
                         [value]="getResultLabel(party)"></p-tag>
                </td>
                <td>
                  <p-tag [severity]="party.done ? 'success' : 'warning'" 
                         [value]="party.done ? 'Terminée' : 'En cours'"></p-tag>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6" class="text-center p-4">
                  Aucune partie trouvée
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      </div>
    </div>
    
    <p-confirmDialog></p-confirmDialog>
  `,
  styles: [`
    .user-detail-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .user-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .user-avatar {
      width: 80px;
      height: 80px;
      background-color: var(--primary-color);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      i {
        font-size: 2.5rem;
        color: white;
      }
    }
    
    .user-identity {
      flex: 1;
      
      h2 {
        margin: 0 0 0.5rem 0;
      }
      
      .user-id {
        color: var(--text-color-secondary);
        margin: 0;
      }
    }
    
    .user-actions {
      display: flex;
      gap: 0.75rem;
    }
    
    .user-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-top: 1rem;
    }
    
    .detail-item {
      label {
        display: block;
        color: var(--text-color-secondary);
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }
      
      p {
        margin: 0;
        font-weight: 500;
      }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1.5rem;
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background-color: var(--surface-ground);
      border-radius: 8px;
      
      .stat-icon {
        font-size: 2rem;
        color: var(--primary-color);
      }
      
      .stat-content {
        h3 {
          margin: 0;
          font-size: 1.5rem;
        }
        
        p {
          margin: 0.25rem 0 0 0;
          color: var(--text-color-secondary);
          font-size: 0.875rem;
        }
      }
    }
    
    .card-header-custom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      
      h3 {
        margin: 0;
      }
    }
    
    .score {
      font-weight: 600;
    }
    
    .text-green-500 { color: var(--green-500); }
    .text-red-500 { color: var(--red-500); }
    .text-blue-500 { color: var(--blue-500); }
    
    :host ::ng-deep {
      .custom-chip-primary {
        background-color: var(--primary-color);
        color: white;
        font-weight: 600;
        font-size: 1.125rem;
      }
      
      .user-info-card,
      .stats-card,
      .history-card {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
    }
    
    @media (max-width: 768px) {
      .user-header {
        flex-direction: column;
        text-align: center;
      }
      
      .user-actions {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;
  userParties: Party[] = [];
  stats: UserStats = {
    totalParties: 0,
    victories: 0,
    defeats: 0,
    winRate: 0,
    totalTicketsUsed: 0
  };
  loading = true;
  userId?: string;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private partiesService: PartiesService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}
  
  ngOnInit(): void {
    this.userId = this.route.snapshot.params['id'];
    if (this.userId) {
      this.loadUserData();
    }
  }
  
  /**
   * Charge les données de l'utilisateur et ses parties
   */
  private loadUserData(): void {
    if (!this.userId) return;
    
    this.loading = true;
    this.usersService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loadUserParties();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les données de l\'utilisateur'
        });
        this.router.navigate(['/users']);
      }
    });
  }
  
  /**
   * Charge l'historique des parties de l'utilisateur
   */
  private loadUserParties(): void {
    if (!this.user) return;
    
    this.partiesService.getAllParties().subscribe({
      next: (parties) => {
        this.userParties = parties.filter(p => 
          p.player1_id === this.user!.id || p.player2_id === this.user!.id
        );
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des parties:', error);
        this.loading = false;
      }
    });
  }
  
  /**
   * Calcule les statistiques de l'utilisateur
   */
  private calculateStats(): void {
    if (!this.user) return;
    
    const completedParties = this.userParties.filter(p => p.done);
    this.stats.totalParties = completedParties.length;
    
    completedParties.forEach(party => {
      const isPlayer1 = party.player1_id === this.user!.id;
      const userScore = isPlayer1 ? party.p1_score : party.p2_score;
      const opponentScore = isPlayer1 ? party.p2_score : party.p1_score;
      
      if (userScore && opponentScore) {
        if (userScore > opponentScore) {
          this.stats.victories++;
        } else if (userScore < opponentScore) {
          this.stats.defeats++;
        }
      }
    });
    
    this.stats.winRate = this.stats.totalParties > 0 
      ? Math.round((this.stats.victories / this.stats.totalParties) * 100)
      : 0;
    
    this.stats.totalTicketsUsed = this.stats.totalParties;
  }
  
  /**
   * Affiche la boîte de dialogue de confirmation de suppression
   */
  confirmDelete(): void {
    if (!this.user) return;
    
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${this.user.nom || ''} ${this.user.prenom || ''}" ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteUser()
    });
  }
  
  /**
   * Supprime l'utilisateur
   */
  private deleteUser(): void {
    if (!this.user) return;
    
    this.usersService.deleteUser(this.userId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'L\'utilisateur a été supprimé avec succès'
        });
        this.router.navigate(['/users']);
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
  
  // Méthodes utilitaires pour l'affichage
  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  }
  
  getGameName(gameId: string): string {
    return 'Jeu ' + gameId.substring(0, 8);
  }
  
  getOpponentName(party: Party): string {
    if (!this.user) return 'N/A';
    const isPlayer1 = party.player1_id === this.user.id;
    const opponentId = isPlayer1 ? party.player2_id : party.player1_id;
    return 'Joueur ' + opponentId.toString().substring(0, 8);
  }
  
  getUserScore(party: Party): number {
    if (!this.user) return 0;
    const isPlayer1 = party.player1_id === this.user.id;
    return isPlayer1 ? (party.p1_score || 0) : (party.p2_score || 0);
  }
  
  getOpponentScore(party: Party): number {
    if (!this.user) return 0;
    const isPlayer1 = party.player1_id === this.user.id;
    return isPlayer1 ? (party.p2_score || 0) : (party.p1_score || 0);
  }
  
  getResultLabel(party: Party): string {
    if (!party.done) return 'En cours';
    
    const userScore = this.getUserScore(party);
    const opponentScore = this.getOpponentScore(party);
    
    if (userScore > opponentScore) return 'Victoire';
    if (userScore < opponentScore) return 'Défaite';
    return 'Égalité';
  }
  
  getResultSeverity(party: Party): string {
    const result = this.getResultLabel(party);
    switch (result) {
      case 'Victoire': return 'success';
      case 'Défaite': return 'danger';
      case 'Égalité': return 'warning';
      default: return 'info';
    }
  }
}