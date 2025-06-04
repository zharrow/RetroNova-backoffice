import { Component, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ArcadeMachinesService } from '../../../../core/services/arcade-machines.service';
import { ArcadeMachine } from '../../../../core/models/arcade-machine.model';
import { UUID } from 'angular2-uuid';
import { ViewChild } from '@angular/core';
import { Table } from 'primeng/table';

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
        <h1>Bornes d'arcade</h1>
        <div class="page-actions">
          <button pButton pRipple type="button" icon="pi pi-plus" label="Nouvelle borne" 
                  class="p-button-success" routerLink="/arcade-machines/new"></button>
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
        
        <p-table #dt [value]="machines" [rows]="10" [paginator]="true" 
                [globalFilterFields]="['name', 'description', 'localisation']"
                [tableStyle]="{'min-width': '75rem'}"
                [rowHover]="true" dataKey="id"
                [showCurrentPageReport]="true" 
                currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} bornes">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="name">Nom <p-sortIcon field="name"></p-sortIcon></th>
              <th pSortableColumn="description">Description <p-sortIcon field="description"></p-sortIcon></th>
              <th pSortableColumn="localisation">Localisation <p-sortIcon field="localisation"></p-sortIcon></th>
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
                <div class="flex justify-content-end gap-2">
                  <button pButton pRipple type="button" icon="pi pi-eye" 
                          class="p-button-rounded p-button-text p-button-info"
                          pTooltip="Voir" tooltipPosition="top"
                          [routerLink]="['/arcade-machines', machine.id]"></button>
                  <button pButton pRipple type="button" icon="pi pi-pencil" 
                          class="p-button-rounded p-button-text p-button-success"
                          pTooltip="Éditer" tooltipPosition="top"
                          [routerLink]="['/arcade-machines/edit', machine.id]"></button>
                  <button pButton pRipple type="button" icon="pi pi-trash" 
                          class="p-button-rounded p-button-text p-button-danger"
                          pTooltip="Supprimer" tooltipPosition="top"
                          (click)="confirmDelete(machine)"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center">Aucune borne d'arcade trouvée.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
    
    <p-confirmDialog #cd header="Confirmation" icon="pi pi-exclamation-triangle">
      <ng-template pTemplate="footer">
        <button pButton icon="pi pi-times" label="Non" (click)="cd.onReject()"></button>
        <button pButton icon="pi pi-check" label="Oui" (click)="cd.onAccept()"></button>
      </ng-template>
    </p-confirmDialog>
  `,
  styles: [`
    .search-container {
      margin-bottom: 1rem;
    }
    
    :host ::ng-deep .p-paginator {
      .p-paginator-current {
        margin-left: auto;
      }
    }
    
    :host ::ng-deep .p-datatable.p-datatable-customers {
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
  @ViewChild('dt') table: Table | undefined;
  machines: ArcadeMachine[] = [];
  loading: boolean = true;
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
    if (this.table) {
      this.table.filterGlobal(($event.target as HTMLInputElement).value, stringVal);
    }
  }
  
  confirmDelete(machine: ArcadeMachine) {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer la borne "${machine.name}" ?`,
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