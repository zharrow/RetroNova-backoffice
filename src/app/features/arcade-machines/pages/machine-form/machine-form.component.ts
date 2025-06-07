import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { ArcadeMachinesService } from '../../../../core/services/arcade-machines.service';
import { GamesService } from '../../../../core/services/games.service';
import { ArcadeMachine } from '../../../../core/models/arcade-machine.model';
import { Game } from '../../../../core/models/game.model';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

interface GameOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-machine-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    CardModule,
    RippleModule,
    LoaderComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>{{ isEditMode ? 'Modifier la borne' : 'Nouvelle borne d\'arcade' }}</h1>
      </div>
      
      <div class="form-container">
        <p-card>
          <app-loader *ngIf="loading"></app-loader>
          
          <form [formGroup]="machineForm" (ngSubmit)="onSubmit()" *ngIf="!loading">
            <div class="form-grid">
              <!-- Nom de la borne -->
              <div class="form-group col-12">
                <label for="name" class="required">Nom de la borne</label>
                <input id="name" type="text" pInputText formControlName="name"
                       [class.ng-invalid]="isFieldInvalid('name')"
                       placeholder="Ex: Borne Rétro Zone 1" />
                <small class="p-error" *ngIf="isFieldInvalid('name')">
                  Le nom de la borne est requis
                </small>
              </div>
              
              <!-- Description -->
              <div class="form-group col-12">
                <label for="description">Description</label>
                <textarea id="description" pInputTextarea formControlName="description"
                          rows="3" placeholder="Description de la borne (optionnel)">
                </textarea>
              </div>
              
              <!-- Localisation -->
              <div class="form-group col-12">
                <label for="localisation">Localisation</label>
                <input id="localisation" type="text" pInputText formControlName="localisation"
                       placeholder="Ex: Salle principale, près de l'entrée" />
              </div>
              
              <!-- Jeux -->
              <div class="form-group col-6">
                <label for="game1_id" class="required">Jeu principal</label>
                <p-dropdown id="game1_id" formControlName="game1_id"
                           [options]="gameOptions" placeholder="Sélectionner un jeu"
                           optionLabel="label" optionValue="value"
                           [filter]="true" filterBy="label"
                           [showClear]="true"
                           [class.ng-invalid]="isFieldInvalid('game1_id')">
                </p-dropdown>
                <small class="p-error" *ngIf="isFieldInvalid('game1_id')">
                  Le jeu principal est requis
                </small>
              </div>
              
              <div class="form-group col-6">
                <label for="game2_id">Jeu secondaire (optionnel)</label>
                <p-dropdown id="game2_id" formControlName="game2_id"
                           [options]="filteredGame2Options" placeholder="Sélectionner un jeu"
                           optionLabel="label" optionValue="value"
                           [filter]="true" filterBy="label"
                           [showClear]="true"
                           [disabled]="!machineForm.get('game1_id')?.value">
                </p-dropdown>
                <small class="text-muted" *ngIf="!machineForm.get('game1_id')?.value">
                  Sélectionnez d'abord le jeu principal
                </small>
              </div>
            </div>
            
            <!-- Section d'information -->
            <div class="info-section" *ngIf="isEditMode">
              <p class="info-text">
                <i class="pi pi-info-circle"></i>
                Les modifications seront appliquées immédiatement à toutes les parties en cours sur cette borne.
              </p>
            </div>
            
            <!-- Actions -->
            <div class="form-actions">
              <button pButton pRipple type="button" label="Annuler" 
                      class="p-button-text" routerLink="/arcade-machines"></button>
              <button pButton pRipple type="submit" label="Enregistrer"
                      [loading]="submitting" [disabled]="machineForm.invalid">
              </button>
            </div>
          </form>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 900px;
      margin: 0 auto;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 1.5rem;
    }
    
    .form-group {
      &.col-12 { grid-column: span 12; }
      &.col-6 { grid-column: span 6; }
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        
        &.required::after {
          content: ' *';
          color: var(--red-500);
        }
      }
      
      input, textarea, :host ::ng-deep p-dropdown {
        width: 100%;
      }
      
      small.p-error {
        display: block;
        margin-top: 0.25rem;
      }
      
      .text-muted {
        color: var(--text-color-secondary);
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }
    }
    
    .info-section {
      margin-top: 2rem;
      padding: 1rem;
      background-color: var(--blue-50);
      border-radius: 6px;
      border-left: 4px solid var(--blue-500);
      
      .info-text {
        margin: 0;
        color: var(--blue-900);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        i {
          color: var(--blue-500);
        }
      }
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--surface-border);
    }
    
    @media (max-width: 768px) {
      .form-group.col-6 {
        grid-column: span 12;
      }
    }
  `]
})
export class MachineFormComponent implements OnInit {
  machineForm: FormGroup;
  isEditMode = false;
  loading = false;
  submitting = false;
  machineId?: string;
  
  games: Game[] = [];
  gameOptions: GameOption[] = [];
  filteredGame2Options: GameOption[] = [];
  
  constructor(
    private fb: FormBuilder,
    private arcadeMachinesService: ArcadeMachinesService,
    private gamesService: GamesService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {
    this.machineForm = this.createForm();
    this.setupFormListeners();
  }
  
  ngOnInit(): void {
    this.machineId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.machineId;
    
    this.loadInitialData();
  }
  
  /**
   * Crée le formulaire réactif avec validations
   */
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: [''],
      localisation: [''],
      game1_id: ['', Validators.required],
      game2_id: ['']
    });
  }
  
  /**
   * Configure les écouteurs du formulaire
   */
  private setupFormListeners(): void {
    // Écouter les changements du jeu principal pour filtrer le jeu secondaire
    this.machineForm.get('game1_id')?.valueChanges.subscribe(game1Id => {
      this.updateFilteredGame2Options(game1Id);
      
      // Réinitialiser le jeu secondaire si c'est le même que le principal
      const game2Id = this.machineForm.get('game2_id')?.value;
      if (game2Id === game1Id) {
        this.machineForm.patchValue({ game2_id: '' });
      }
    });
  }
  
  /**
   * Charge les données initiales (jeux et machine en mode édition)
   */
  private loadInitialData(): void {
    this.loading = true;
    
    const requests = [this.gamesService.getAllGames()];
    
    if (this.isEditMode && this.machineId) {
      requests.push(this.arcadeMachinesService.getMachineById(this.machineId));
    }
    
    forkJoin(requests).subscribe({
      next: ([games, machine]) => {
        this.games = games as Game[];
        this.setupGameOptions();
        
        if (machine) {
          this.patchFormWithMachine(machine as ArcadeMachine);
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les données'
        });
        this.router.navigate(['/arcade-machines']);
      }
    });
  }
  
  /**
   * Configure les options de jeux pour les dropdowns
   */
  private setupGameOptions(): void {
    this.gameOptions = this.games.map(game => ({
      label: `${game.name} (${game.nb_min_player}-${game.nb_max_player} joueurs)`,
      value: game.id.toString()
    }));
    
    this.filteredGame2Options = [...this.gameOptions];
  }
  
  /**
   * Met à jour les options du jeu secondaire en excluant le jeu principal
   */
  private updateFilteredGame2Options(game1Id: string): void {
    if (!game1Id) {
      this.filteredGame2Options = [...this.gameOptions];
    } else {
      this.filteredGame2Options = this.gameOptions.filter(
        option => option.value !== game1Id
      );
    }
  }
  
  /**
   * Remplit le formulaire avec les données de la machine en édition
   */
  private patchFormWithMachine(machine: ArcadeMachine): void {
    this.machineForm.patchValue({
      name: machine.name,
      description: machine.description,
      localisation: machine.localisation,
      game1_id: machine.game1_id?.toString(),
      game2_id: machine.game2_id?.toString()
    });
  }
  
  /**
   * Vérifie si un champ est invalide et a été touché
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.machineForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  /**
   * Soumet le formulaire
   */
  onSubmit(): void {
    if (this.machineForm.invalid) {
      Object.keys(this.machineForm.controls).forEach(key => {
        this.machineForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.submitting = true;
    const formData = this.prepareFormData();
    
    const request$ = this.isEditMode && this.machineId
      ? this.arcadeMachinesService.updateMachine(this.machineId, formData)
      : this.arcadeMachinesService.createMachine(formData);
    
    request$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: `La borne a été ${this.isEditMode ? 'modifiée' : 'créée'} avec succès`
        });
        this.router.navigate(['/arcade-machines']);
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible d\'enregistrer la borne'
        });
        this.submitting = false;
      }
    });
  }
  
  /**
   * Prépare les données du formulaire pour l'envoi
   */
  private prepareFormData(): any {
    const formValue = this.machineForm.value;
    
    // Convertir les IDs de jeux en UUID si nécessaire
    const data: any = {
      name: formValue.name,
      description: formValue.description || undefined,
      localisation: formValue.localisation || undefined,
      game1_id: formValue.game1_id
    };
    
    // Ajouter game2_id seulement s'il est défini
    if (formValue.game2_id) {
      data.game2_id = formValue.game2_id;
    }
    
    return data;
  }
}