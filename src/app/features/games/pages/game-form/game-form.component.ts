import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { GamesService } from '../../../../core/services/games.service';
import { Game } from '../../../../core/models/game.model';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-game-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CardModule,
    RippleModule,
    LoaderComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>{{ isEditMode ? 'Modifier le jeu' : 'Nouveau jeu' }}</h1>
      </div>
      
      <div class="form-container">
        <p-card>
          <app-loader *ngIf="loading"></app-loader>
          
          <form [formGroup]="gameForm" (ngSubmit)="onSubmit()" *ngIf="!loading">
            <div class="form-grid">
              <!-- Nom du jeu -->
              <div class="form-group col-12">
                <label for="name" class="required">Nom du jeu</label>
                <input id="name" type="text" pInputText formControlName="name"
                       [class.ng-invalid]="isFieldInvalid('name')"
                       placeholder="Ex: Street Fighter II" />
                <small class="p-error" *ngIf="isFieldInvalid('name')">
                  Le nom du jeu est requis
                </small>
              </div>
              
              <!-- Description -->
              <div class="form-group col-12">
                <label for="description">Description</label>
                <textarea id="description" pInputTextarea formControlName="description"
                          rows="4" placeholder="Description du jeu (optionnel)">
                </textarea>
              </div>
              
              <!-- Nombre de joueurs -->
              <div class="form-group col-6">
                <label for="nb_min_player" class="required">Nombre minimum de joueurs</label>
                <p-inputNumber id="nb_min_player" formControlName="nb_min_player"
                               [min]="1" [max]="10" [showButtons]="true"
                               [class.ng-invalid]="isFieldInvalid('nb_min_player')">
                </p-inputNumber>
                <small class="p-error" *ngIf="isFieldInvalid('nb_min_player')">
                  @if (gameForm.get('nb_min_player')?.hasError('required')) {
                    Ce champ est requis
                  }
                  @if (gameForm.get('nb_min_player')?.hasError('min')) {
                    La valeur minimale est 1
                  }
                </small>
              </div>
              
              <div class="form-group col-6">
                <label for="nb_max_player" class="required">Nombre maximum de joueurs</label>
                <p-inputNumber id="nb_max_player" formControlName="nb_max_player"
                               [min]="1" [max]="10" [showButtons]="true"
                               [class.ng-invalid]="isFieldInvalid('nb_max_player')">
                </p-inputNumber>
                <small class="p-error" *ngIf="isFieldInvalid('nb_max_player')">
                  @if (gameForm.get('nb_max_player')?.hasError('required')) {
                    Ce champ est requis
                  }
                  @if (gameForm.get('nb_max_player')?.hasError('min')) {
                    La valeur minimale est 1
                  }
                  @if (gameForm.get('nb_max_player')?.hasError('minPlayers')) {
                    Le nombre max doit être ≥ au nombre min
                  }
                </small>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="form-actions">
              <button pButton pRipple type="button" label="Annuler" 
                      class="p-button-text" routerLink="/games"></button>
              <button pButton pRipple type="submit" label="Enregistrer"
                      [loading]="submitting" [disabled]="gameForm.invalid">
              </button>
            </div>
          </form>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 800px;
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
      
      input, textarea, :host ::ng-deep p-inputNumber {
        width: 100%;
      }
      
      small.p-error {
        display: block;
        margin-top: 0.25rem;
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
export class GameFormComponent implements OnInit {
  gameForm: FormGroup;
  isEditMode = false;
  loading = false;
  submitting = false;
  gameId?: string;
  
  constructor(
    private fb: FormBuilder,
    private gamesService: GamesService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {
    this.gameForm = this.createForm();
  }
  
  ngOnInit(): void {
    this.gameId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.gameId;
    
    if (this.isEditMode && this.gameId) {
      this.loadGame(this.gameId);
    }
  }
  
  /**
   * Crée le formulaire réactif avec validations
   */
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: [''],
      nb_min_player: [1, [Validators.required, Validators.min(1)]],
      nb_max_player: [1, [Validators.required, Validators.min(1)]]
    }, { validators: this.playerCountValidator });
  }
  
  /**
   * Validateur personnalisé pour vérifier la cohérence des nombres de joueurs
   */
  private playerCountValidator(group: FormGroup): {[key: string]: boolean} | null {
    const min = group.get('nb_min_player')?.value;
    const max = group.get('nb_max_player')?.value;
    
    if (min && max && max < min) {
      group.get('nb_max_player')?.setErrors({ minPlayers: true });
      return { minPlayers: true };
    }
    
    // Nettoyer l'erreur si elle n'est plus valide
    const errors = group.get('nb_max_player')?.errors;
    if (errors?.['minPlayers']) {
      delete errors['minPlayers'];
      const hasErrors = Object.keys(errors).length > 0;
      group.get('nb_max_player')?.setErrors(hasErrors ? errors : null);
    }
    
    return null;
  }
  
  /**
   * Charge les données du jeu en mode édition
   */
  private loadGame(id: string): void {
    this.loading = true;
    this.gamesService.getGameById(id).subscribe({
      next: (game) => {
        this.gameForm.patchValue({
          name: game.name,
          description: game.description,
          nb_min_player: game.nb_min_player,
          nb_max_player: game.nb_max_player
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du jeu:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les données du jeu'
        });
        this.router.navigate(['/games']);
      }
    });
  }
  
  /**
   * Vérifie si un champ est invalide et a été touché
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.gameForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  /**
   * Soumet le formulaire
   */
  onSubmit(): void {
    if (this.gameForm.invalid) {
      Object.keys(this.gameForm.controls).forEach(key => {
        this.gameForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.submitting = true;
    const gameData = this.gameForm.value;
    
    const request$ = this.isEditMode && this.gameId
      ? this.gamesService.updateGame(this.gameId, gameData)
      : this.gamesService.createGame(gameData);
    
    request$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: `Le jeu a été ${this.isEditMode ? 'modifié' : 'créé'} avec succès`
        });
        this.router.navigate(['/games']);
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible d\'enregistrer le jeu'
        });
        this.submitting = false;
      }
    });
  }
}