import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
import { MessageService } from 'primeng/api';
import { PartiesService } from '../../../../core/services/parties.service';
import { Party } from '../../../../core/models/party.model';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

interface PartyDisplay extends Party {
  player1_name?: string;
  player2_name?: string;
  game_name?: string;
  machine_name?: string;
}

@Component({
  selector: 'app-parties-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    RippleModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    TabViewModule,
    LoaderComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Parties</h1>
      </div>
      
      <div class="page-content">
        <p-tabView>
          <!-- Parties en cours -->
          <p-tabPanel header="En cours" leftIcon="pi pi-play-circle">
            <ng-template pTemplate="content">
              <div class="search-container">
                <span class="p-input-icon-left">
                  <i class="pi pi-search"></i>
                  <input pInputText type="text" placeholder="Rechercher..." 
                        (input)="applyFilterGlobal($event, 'active')" />
                </span>
              </div>
              
              <p-table #dtActive [value]="activeParties" [loading]="loading"
                      [rows]="10" [paginator]="true" [rowHover]="true"
                      [tableStyle]="{'min-width': '70rem'}"
                      [globalFilterFields]="['player1_name', 'player2_name', 'game_name', 'machine_name']">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Joueur 1</th>
                    <th>Joueur 2</th>
                    <th>Jeu</th>
                    <th>Borne</th>
                    <th>Code</th>
                    <th>Bar</th>
                    <th>Début</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-party>
                  <tr>
                    <td>{{ party.player1_name || 'Joueur ' + party.player1_id.substring(0, 8) }}</td>
                    <td>{{ party.player2_name || 'Joueur ' + party.player2_id.substring(0, 8) }}</td>
                    <td>{{ party.game_name || 'Jeu ' + party.game_id.substring(0, 8) }}</td>
                    <td>{{ party.machine_name || 'Borne ' + party.machine_id.substring(0, 8) }}</td>
                    <td>
                      <p-tag [value]="party.password || 'N/A'" severity="info"></p-tag>
                    </td>
                    <td>
                      <i class="pi" [ngClass]="party.bar ? 'pi-check text-green-500' : 'pi-times text-red-500'"></i>
                    </td>
                    <td>{{ formatDate(party.created_at) }}</td>
                    <td>
                      <button pButton pRipple type="button" icon="pi pi-eye" 
                              class="p-button-rounded p-button-text p-button-info"
                              pTooltip="Détails" tooltipPosition="top"
                              (click)="viewPartyDetails(party)"></button>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="8" class="text-center p-4">
                      <i class="pi pi-info-circle mr-2"></i>
                      Aucune partie en cours
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </ng-template>
          </p-tabPanel>
          
          <!-- Parties terminées -->
          <p-tabPanel header="Terminées" leftIcon="pi pi-check-circle">
            <ng-template pTemplate="content">
              <div class="search-container">
                <span class="p-input-icon-left">
                  <i class="pi pi-search"></i>
                  <input pInputText type="text" placeholder="Rechercher..." 
                        (input)="applyFilterGlobal($event, 'completed')" />
                </span>
              </div>
              
              <p-table #dtCompleted [value]="completedParties" [loading]="loading"
                      [rows]="10" [paginator]="true" [rowHover]="true"
                      [tableStyle]="{'min-width': '80rem'}"
                      [globalFilterFields]="['player1_name', 'player2_name', 'game_name', 'machine_name']">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Joueur 1</th>
                    <th>Score J1</th>
                    <th>Joueur 2</th>
                    <th>Score J2</th>
                    <th>Jeu</th>
                    <th>Borne</th>
                    <th>Score total</th>
                    <th>Date</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-party>
                  <tr>
                    <td>
                      {{ party.player1_name || 'Joueur ' + party.player1_id.substring(0, 8) }}
                      <i *ngIf="isWinner(party, 1)" class="pi pi-trophy text-yellow-500 ml-2"></i>
                    </td>
                    <td class="text-center font-bold">{{ party.p1_score || 0 }}</td>
                    <td>
                      {{ party.player2_name || 'Joueur ' + party.player2_id.substring(0, 8) }}
                      <i *ngIf="isWinner(party, 2)" class="pi pi-trophy text-yellow-500 ml-2"></i>
                    </td>
                    <td class="text-center font-bold">{{ party.p2_score || 0 }}</td>
                    <td>{{ party.game_name || 'Jeu ' + party.game_id.substring(0, 8) }}</td>
                    <td>{{ party.machine_name || 'Borne ' + party.machine_id.substring(0, 8) }}</td>
                    <td class="text-center">
                      <p-tag [value]="(party.total_score || 0).toString()" severity="success"></p-tag>
                    </td>
                    <td>{{ formatDate(party.updated_at) }}</td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="8" class="text-center p-4">
                      <i class="pi pi-info-circle mr-2"></i>
                      Aucune partie terminée
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </ng-template>
          </p-tabPanel>
          
          <!-- Toutes les parties -->
          <p-tabPanel header="Toutes" leftIcon="pi pi-list">
            <ng-template pTemplate="content">
              <app-loader *ngIf="loading" size="large"></app-loader>
              <p class="text-center text-muted" *ngIf="!loading">
                Total : {{ allParties.length }} parties
              </p>
            </ng-template>
          </p-tabPanel>
        </p-tabView>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      margin-bottom: 1.5rem;
    }
    
    .text-green-500 { color: var(--green-500); }
    .text-red-500 { color: var(--red-500); }
    .text-yellow-500 { color: var(--yellow-500); }
    
    .font-bold { font-weight: 600; }
    .text-center { text-align: center; }
    .text-muted { 
      color: var(--text-color-secondary);
      font-style: italic;
    }
    
    :host ::ng-deep {
      .p-tabview-panels {
        padding-top: 1.5rem;
      }
      
      .p-tag {
        font-weight: 600;
      }
    }
    