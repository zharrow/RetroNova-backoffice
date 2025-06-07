import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { GamesService } from '../../../../core/services/games.service';
import { Game } from '../../../../core/models/game.model';

@Component({
  selector: 'app-games-list',
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
    TagModule
  ],
  providers: [ConfirmationService],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Jeux</h1>
        <div class="page-actions">
          <button pButton pRipple type="button" icon="pi pi-plus" label="Nouveau jeu" 
                  class="p-button-success" routerLink="/games/new"></button>
        </div>
      </div>
      
      <div class="page-content">
        <div class="search-container">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input pInputText type="text" placeholder="Rechercher..." 
                  (input)="applyFilterGlobal($event, 'contains')" />
          </span>
        </div>
        
        <p-table #dt [value]="games" [rows]="10" [paginator]="true" 
                [globalFilterFields]="['name', 'description']"
                [tableStyle]="{'min-width': '60rem'}"
                [rowHover]="true" dataKey="id"
                [showCurrentPageReport]="true" 
                currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} jeux"
                [loading]="loading">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="name" style="width: 25%">
                Nom <p-sortIcon field="name"></p-sortIcon>
              </th>
              <th pSortableColumn="description" style="width: 35%">
                Description <p-sortIcon field="description"></p-sortIcon>
              </th>
              <th pSortableColumn="nb_min_player" style="width: 15%">
                Joueurs min <p-sortIcon field="nb_min_player"></p-sortIcon>
              </th>
              <th pSortableColumn="nb_max_player" style="width: 15%">
                Joueurs max <p-sortIcon field="nb_max_player"></p-sortIcon>
              </th>
              <th style="width: 10%">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-game>
            <tr>
              <td>
                <span class="font-bold">{{ game.name }}</span>
              </td>
              <td>
                <span class="text-sm">{{ game.description || 'Aucune description' }}</span>
              </td>
              <td class="text-center">
                <p-tag [value]="game.nb_min_player.toString()" severity="info"></p-tag>
              </td>
              <td class="text-center">
                <p-tag [value]="game.nb_max_player.toString()" severity="success"></p-tag>
              </td>
              <td>
                <div class="flex justify-content-center gap-2">
                  <button pButton pRipple type="button" icon="pi pi-pencil" 
                          class="p-button-rounded p-button-text p-button-success"
                          pTooltip="Éditer" tooltipPosition="top"
                          [routerLink]="['/games/edit', game.id]"></button>
                  <button pButton pRipple type="button" icon="pi pi-trash" 
                          class="p-button-rounded p-button-text p-button-danger"
                          pTooltip="Supprimer" tooltipPosition="top"
                          (click)="confirmDelete(game)"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="text-center p-4">
                <i class="pi pi-info-circle mr-2"></i>
                Aucun jeu trouvé.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
    
    <p-confirmDialog></p-confirmDialog>
  `,
  styles: [`
    .search-container {
      margin-bottom: 1.5rem;
    }
    
    .text-sm {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }
    
    .font-bold {
      font-weight: 600;
    }
    
    :host ::ng-deep {
      .p-tag {
        font-weight: 600;
      }
      
      .p-datatable .p-datatable-tbody > tr > td {
        padding: 1rem;
      }
    }
  `]
})
export class GamesListComponent implements OnInit {
  @ViewChild('dt') table: Table | undefined;
  games: Game[] = [];
  loading = true;
  
  constructor(
    private gamesService: GamesService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}
  
  ngOnInit(): void {
    this.loadGames();
  }
  
  /**
   * Charge la liste des jeux depuis l'API
   */
  private loadGames(): void {
    this.loading = true;
    this.gamesService.getAllGames().subscribe({
      next: (data) => {
        this.games = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des jeux:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger la liste des jeux'
        });
        this.loading = false;
      }
    });
  }
  
  /**
   * Applique un filtre global sur la table
   */
  applyFilterGlobal($event: Event, stringVal: string): void {
    const target = $event.target as HTMLInputElement;
    this.table?.filterGlobal(target.value, stringVal);
  }
  
  /**
   * Affiche la boîte de dialogue de confirmation avant suppression
   */
  confirmDelete(game: Game): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer le jeu "${game.name}" ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteGame(game.id.toString()),
      reject: () => {}
    });
  }
  
  /**
   * Supprime un jeu après confirmation
   */
  private deleteGame(id: string): void {
    this.gamesService.deleteGame(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Le jeu a été supprimé avec succès'
        });
        this.loadGames();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de supprimer le jeu'
        });
      }
    });
  }
}