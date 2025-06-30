// src/app/features/users/pages/users-list/users-list.component.ts

import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
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
    TagModule
  ],
  providers: [ConfirmationService],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Utilisateurs</h1>
      </div>
      
      <div class="page-content">
        <div class="search-container">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input pInputText type="text" placeholder="Rechercher..." 
                  (input)="applyFilterGlobal($event, 'contains')" />
          </span>
        </div>
        
        <p-table #dt [value]="users()" [rows]="10" [paginator]="true" 
                [globalFilterFields]="['first_name', 'last_name', 'publique_id', 'firebase_id']"
                [tableStyle]="{'min-width': '75rem'}"
                [rowHover]="true" dataKey="id"
                [showCurrentPageReport]="true" 
                [loading]="loading()"
                currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} utilisateurs">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="first_name">Prénom <p-sortIcon field="first_name"></p-sortIcon></th>
              <th pSortableColumn="last_name">Nom <p-sortIcon field="last_name"></p-sortIcon></th>
              <th pSortableColumn="publique_id">ID Public <p-sortIcon field="publique_id"></p-sortIcon></th>
              <th pSortableColumn="nb_ticket">Tickets <p-sortIcon field="nb_ticket"></p-sortIcon></th>
              <th pSortableColumn="bar">Bar <p-sortIcon field="bar"></p-sortIcon></th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-user>
            <tr>
              <td>{{user.first_name || 'Non défini'}}</td>
              <td>{{user.last_name || 'Non défini'}}</td>
              <td>{{user.publique_id}}</td>
              <td>{{user.nb_ticket}}</td>
              <td>
                <p-tag [severity]="user.bar ? 'success' : 'danger'" 
                      [value]="user.bar ? 'Oui' : 'Non'"></p-tag>
              </td>
              <td>
                <div class="flex justify-content-end gap-2">
                  <button pButton pRipple type="button" icon="pi pi-eye" 
                          class="p-button-rounded p-button-text p-button-info"
                          pTooltip="Voir" tooltipPosition="top"
                          [routerLink]="['/users', user.id]"></button>
                  <button pButton pRipple type="button" icon="pi pi-pencil" 
                          class="p-button-rounded p-button-text p-button-success"
                          pTooltip="Éditer" tooltipPosition="top"
                          [routerLink]="['/users/edit', user.id]"></button>
                  <button pButton pRipple type="button" icon="pi pi-trash" 
                          class="p-button-rounded p-button-text p-button-danger"
                          pTooltip="Supprimer" tooltipPosition="top"
                          (click)="confirmDelete(user)"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center">Aucun utilisateur trouvé.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
    
    <p-confirmDialog></p-confirmDialog>
  `,
  styles: [`
    .search-container {
      margin-bottom: 1rem;
    }
    
    .page-content {
      animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class UsersListComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly table = viewChild<Table>('dt');
  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  
  ngOnInit() {
    this.loadUsers();
  }
  
  /**
   * Charge la liste des utilisateurs
   */
  private loadUsers(): void {
    this.loading.set(true);
    this.usersService.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs', error);
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
   * Applique un filtre global sur la table
   */
  applyFilterGlobal($event: Event, stringVal: string): void {
    const target = $event.target as HTMLInputElement;
    this.table()?.filterGlobal(target.value, stringVal);
  }
  
  /**
   * Confirme la suppression d'un utilisateur
   */
  confirmDelete(user: User): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.nom || ''} ${user.prenom || ''}" (ID: ${user.firebase_uid}) ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteUser(user.firebase_uid)
    });
  }
  
  /**
   * Supprime un utilisateur
   */
  private deleteUser(id: string): void {
    this.usersService.deleteUser(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Utilisateur supprimé avec succès'
        });
        this.loadUsers();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression de l\'utilisateur', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de supprimer l\'utilisateur'
        });
      }
    });
  }
}