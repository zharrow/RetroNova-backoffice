// src/app/features/arcade-machines/pages/machines-list/machines-list.component.ts

import { Component, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ArcadeMachinesService } from '../../../../core/services/arcade-machines.service';
import { ArcadeMachine } from '../../../../core/models/arcade-machine.model';

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
    TooltipModule
  ],
  providers: [ConfirmationService],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>
          <i class="fas fa-desktop mr-2"></i>
          Bornes d'arcade
        </h1>
        <div class="page-actions">
          <button pButton pRipple type="button" label="Nouvelle borne" 
                  class="p-button-success" routerLink="/arcade-machines/new">
            <i class="fas fa-plus mr-2"></i>
          </button>
        </div>
      </div>
      
      
      <div class="page-content">
        <div class="search-container">
          <span class="p-input-icon-left">
            <i class="fas fa-search"></i>
            <input pInputText type="text" placeholder="Rechercher..." 
                  (input)="applyFilterGlobal($event, 'contains')" />
          </span>
        </div>
        
        <p-table #dt [value]="machines" [rows]="10" [paginator]="true" 
                [globalFilterFields]="['name', 'description', 'localisation']"
                [tableStyle]="{'min-width': '75rem'}"
                [rowHover]="true" dataKey="id"
                [showCurrentPageReport]="true" 
                currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} bornes">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="name">
                Nom <i class="fas fa-sort ml-1 sort-icon"></i>
              </th>
              <th pSortableColumn="description">
                Description <i class="fas fa-sort ml-1 sort-icon"></i>
              </th>
              <th pSortableColumn="localisation">
                Localisation <i class="fas fa-sort ml-1 sort-icon"></i>
              </th>
              <th>Jeu 1</th>
              <th>Jeu 2</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-machine>
            <tr>
              <td>{{machine.name || 'Non défini'}}</td>
              <td>{{machine.description || 'Non défini'}}</td>
              <td>{{machine.localisation || 'Non défini'}}</td>
              <td>{{getGameName(machine.game1_id)}}</td>
              <td>{{getGameName(machine.game2_id)}}</td>
              <td>
                <div class="actions-container">
                  <button pButton pRipple type="button" 
                          class="p-button-rounded p-button-text p-button-info"
                          pTooltip="Voir" tooltipPosition="top"
                          [routerLink]="['/arcade-machines', machine.id]">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button pButton pRipple type="button" 
                          class="p-button-rounded p-button-text p-button-success"
                          pTooltip="Éditer" tooltipPosition="top"
                          [routerLink]="['/arcade-machines/edit', machine.id]">
                    <i class="fas fa-pencil"></i>
                  </button>
                  <button pButton pRipple type="button" 
                          class="p-button-rounded p-button-text p-button-danger"
                          pTooltip="Supprimer" tooltipPosition="top"
                          (click)="confirmDelete(machine)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center">
                <i class="fas fa-info-circle mr-2"></i>
                Aucune borne d'arcade trouvée.
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
    
    .actions-container {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .mr-1 { margin-right: 0.25rem; }
    .mr-2 { margin-right: 0.5rem; }
    .ml-1 { margin-left: 0.25rem; }
    
    .sort-icon {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }
    
    :host ::ng-deep {
      .p-button i {
        font-size: 0.875rem;
      }
      
      .p-button.p-button-rounded {
        width: 2rem;
        height: 2rem;
        padding: 0;
        
        i {
          font-size: 0.875rem;
        }
      }
      
      .p-button.p-button-text:not(:disabled):hover {
        background-color: rgba(0, 0, 0, 0.04);
      }
      
      .p-button.p-button-text.p-button-info:not(:disabled):hover {
        background-color: rgba(33, 150, 243, 0.04);
      }
      
      .p-button.p-button-text.p-button-success:not(:disabled):hover {
        background-color: rgba(76, 175, 80, 0.04);
      }
      
      .p-button.p-button-text.p-button-danger:not(:disabled):hover {
        background-color: rgba(244, 67, 54, 0.04);
      }
      
      .p-paginator {
        .p-paginator-current {
          margin-left: auto;
        }
      }
      
      .p-datatable.p-datatable-customers {
        .p-datatable-header {
          padding: 1rem;
          text-align: left;
          font-size: 1.5rem;
        }

        .p-paginator {
          padding: 1rem;
        }

        .p-datatable-thead > tr > th {
          text-align: left;
        }

        .p-dropdown-label:not(.p-placeholder) {
          text-transform: uppercase;
        }
      }
    }
    
    /* Responsive */
    @media screen and (max-width: 960px) {
      :host ::ng-deep .p-datatable.p-datatable-customers {
        .p-datatable-thead > tr > th,
        .p-datatable-tfoot > tr > td {
          display: none !important;
        }

        .p-datatable-tbody > tr {
          border-bottom: 1px solid var(--surface-d);

          > td {
            text-align: left;
            display: block;
            border: 0 none !important;
            width: 100% !important;
            float: left;
            clear: left;
            border: 0 none;

            .p-column-title {
              padding: .4rem;
              min-width: 30%;
              display: inline-block;
              margin: -.4rem 1rem -.4rem -.4rem;
              font-weight: bold;
            }

            .p-progressbar {
              margin-top: .5rem;
            }
          }
        }
      }
    }
  `]
})
export class MachinesListComponent implements OnInit {
  readonly table = viewChild<Table>('dt');
  machines: ArcadeMachine[] = [];
  loading = true;
  gamesCache: {[key: string]: string} = {};
  
  constructor(
    private arcadeMachinesService: ArcadeMachinesService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}
  
  ngOnInit() {
    this.loadMachines();
  }
  
  loadMachines() {
    this.loading = true;
    this.arcadeMachinesService.getAllMachines().subscribe({
      next: (data) => {
        this.machines = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des bornes d\'arcade', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les bornes d\'arcade'
        });
        this.loading = false;
      }
    });
  }
  
  applyFilterGlobal($event: any, stringVal: string) {
    const table = this.table();
    if (table) {
      table.filterGlobal(($event.target as HTMLInputElement).value, stringVal);
    }
  }
  
  confirmDelete(machine: ArcadeMachine) {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer la borne "${machine.name}" ?`,
      header: 'Confirmation',
      icon: 'fas fa-exclamation-triangle',
      accept: () => {
        this.deleteMachine(machine.id.toString());
      }
    });
  }
  
  deleteMachine(id: string) {
    this.arcadeMachinesService.deleteMachine(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Borne d\'arcade supprimée avec succès'
        });
        this.loadMachines();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression de la borne d\'arcade', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de supprimer la borne d\'arcade'
        });
      }
    });
  }
  
  getGameName(gameId: string | null): string {
    if (!gameId) return 'Non défini';
    
    if (this.gamesCache[gameId]) {
      return this.gamesCache[gameId];
    }
    
    // Normalement, nous devrions charger les noms des jeux depuis le service
    // mais pour simplifier, nous retournons juste l'ID pour l'instant
    return 'Jeu ' + gameId.substring(0, 8);
  }
}