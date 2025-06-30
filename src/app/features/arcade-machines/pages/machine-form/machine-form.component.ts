// src/app/features/arcade-machines/pages/machine-form/machine-form.component.ts

import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
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
import { ArcadesService } from '../../../../core/services/arcades.service';
import { GamesService } from '../../../../core/services/games.service';
import { Arcade } from '../../../../core/models/arcade.model';
import { Game } from '../../../../core/models/game.model';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

interface GameOption {
  readonly label: string;
  readonly value: number;
}

interface MachineFormData {
  readonly nom: string;
  readonly description?: string;
  readonly localisation?: string;
  readonly latitude?: number;
  readonly longitude?: number;
}

/**
 * Strategy Pattern pour la validation des formulaires
 */
abstract class FormValidationStrategy {
  abstract validate(form: FormGroup): boolean;
  abstract getErrors(form: FormGroup): string[];
}

class MachineFormValidationStrategy extends FormValidationStrategy {
  validate(form: FormGroup): boolean {
    return form.valid;
  }

  getErrors(form: FormGroup): string[] {
    const errors: string[] = [];
    
    if (form.get('nom')?.hasError('required')) {
      errors.push('Le nom de la borne est requis');
    }
    
    if (form.get('localisation')?.hasError('required')) {
      errors.push('La localisation est requise');
    }
    
    return errors;
  }
}

/**
 * Factory Pattern pour la création d'options
 */
class GameOptionsFactory {
  static createOptions(games: Game[]): GameOption[] {
    return games.map(game => ({
      label: `${game.nom} (${game.min_players}-${game.max_players} joueurs)`,
      value: game.id
    }));
  }
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
    DropdownModule,
    CardModule,
    RippleModule,
    LoaderComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>{{ pageTitle() }}</h1>
      </div>
      
      <div class="form-container">
        <p-card>
          @if (loading()) {
            <app-loader size="large">Chargement...</app-loader>
          } @else {
            <form [formGroup]="machineForm" (ngSubmit)="handleSubmit()">
              <div class="form-grid">
                <!-- Nom de la borne -->
                <div class="form-group col-12">
                  <label for="nom" class="required">Nom de la borne</label>
                  <input 
                    id="nom" 
                    type="text" 
                    pInputText 
                    formControlName="nom"
                    [class.ng-invalid]="isFieldInvalid('nom')"
                    placeholder="Ex: Borne Rétro Zone 1" />
                  @if (isFieldInvalid('nom')) {
                    <small class="p-error">Le nom de la borne est requis</small>
                  }
                </div>
                
                <!-- Description -->
                <div class="form-group col-12">
                  <label for="description">Description</label>
                  <textarea 
                    id="description" 
                    pInputTextarea 
                    formControlName="description"
                    rows="3" 
                    placeholder="Description de la borne (optionnel)">
                  </textarea>
                </div>
                
                <!-- Localisation -->
                <div class="form-group col-12">
                  <label for="localisation" class="required">Localisation</label>
                  <input 
                    id="localisation" 
                    type="text" 
                    pInputText 
                    formControlName="localisation"
                    [class.ng-invalid]="isFieldInvalid('localisation')"
                    placeholder="Ex: Salle principale, près de l'entrée" />
                  @if (isFieldInvalid('localisation')) {
                    <small class="p-error">La localisation est requise</small>
                  }
                </div>

                <!-- Coordonnées -->
                <div class="form-group col-6">
                  <label for="latitude">Latitude</label>
                  <input 
                    id="latitude" 
                    type="number" 
                    pInputText 
                    formControlName="latitude"
                    step="0.000001"
                    placeholder="48.8566" />
                </div>

                <div class="form-group col-6">
                  <label for="longitude">Longitude</label>
                  <input 
                    id="longitude" 
                    type="number" 
                    pInputText 
                    formControlName="longitude"
                    step="0.000001"
                    placeholder="2.3522" />
                </div>
              </div>
              
              @if (isEditMode() && formValidationErrors().length > 0) {
                <div class="validation-errors">
                  <h4>Erreurs de validation :</h4>
                  <ul>
                    @for (error of formValidationErrors(); track error) {
                      <li>{{ error }}</li>
                    }
                  </ul>
                </div>
              }
              
              <!-- Actions -->
              <div class="form-actions">
                <button 
                  pButton 
                  pRipple 
                  type="button" 
                  label="Annuler" 
                  severity="secondary"
                  outlined
                  routerLink="/arcade-machines">
                </button>
                <button 
                  pButton 
                  pRipple 
                  type="submit" 
                  label="Enregistrer"
                  [loading]="submitting()" 
                  [disabled]="!canSubmit()">
                </button>
              </div>
            </form>
          }
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 900px;
      margin: 0 auto;
      animation: fadeIn 0.6s ease-out;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--space-6);
    }
    
    .form-group {
      &.col-12 { grid-column: span 12; }
      &.col-6 { grid-column: span 6; }
      
      label {
        display: block;
        margin-bottom: var(--space-2);
        font-weight: 600;
        color: var(--text-color);
        
        &.required::after {
          content: ' *';
          color: var(--arcade-red);
        }
      }
      
      input, textarea, :host ::ng-deep p-dropdown {
        width: 100%;
        transition: all var(--transition-normal);
        
        &:focus {
          transform: translateY(-1px);
          box-shadow: var(--shadow-glow);
        }
      }
      
      small.p-error {
        display: block;
        margin-top: var(--space-1);
        color: var(--arcade-red);
        font-size: var(--text-sm);
      }
    }
    
    .validation-errors {
      margin-top: var(--space-6);
      padding: var(--space-4);
      background: rgba(239, 68, 68, 0.1);
      border-radius: var(--radius-lg);
      border-left: 4px solid var(--arcade-red);
      
      h4 {
        margin: 0 0 var(--space-2) 0;
        color: var(--arcade-red);
        font-size: var(--text-base);
      }
      
      ul {
        margin: 0;
        padding-left: var(--space-4);
        
        li {
          color: var(--arcade-red);
          font-size: var(--text-sm);
        }
      }
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-8);
      padding-top: var(--space-6);
      border-top: 1px solid var(--surface-border);
    }
    
    @media (max-width: 768px) {
      .form-group.col-6 {
        grid-column: span 12;
      }
      
      .form-actions {
        flex-direction: column-reverse;
        
        button {
          width: 100%;
        }
      }
    }
  `]
})
export class MachineFormComponent implements OnInit {
  // Services injectés avec la nouvelle API
  private readonly fb = inject(FormBuilder);
  private readonly arcadesService = inject(ArcadesService);
  private readonly gamesService = inject(GamesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  
  // Validation strategy
  private readonly validationStrategy = new MachineFormValidationStrategy();
  
  // Signals pour l'état du composant
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly machineId = signal<number | null>(null);
  readonly currentMachine = signal<Arcade | null>(null);
  readonly games = signal<Game[]>([]);
  
  // Computed values
  readonly isEditMode = computed(() => !!this.machineId());
  readonly pageTitle = computed(() => 
    this.isEditMode() ? 'Modifier la borne' : 'Nouvelle borne d\'arcade'
  );
  readonly gameOptions = computed(() => 
    GameOptionsFactory.createOptions(this.games())
  );
  readonly canSubmit = computed(() => 
    this.machineForm.valid && !this.submitting()
  );
  readonly formValidationErrors = computed(() => 
    this.validationStrategy.getErrors(this.machineForm)
  );
  
  // Formulaire réactif
  protected readonly machineForm: FormGroup;
  
  constructor() {
    this.machineForm = this.createForm();
    this.setupFormEffects();
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  /**
   * Initialise le composant selon le mode (création/édition)
   */
  private initializeComponent(): void {
    const id = this.route.snapshot.params['id'];
    
    if (id) {
      this.machineId.set(+id);
      this.loadMachineData();
    } else {
      this.loadGamesOnly();
    }
  }

  /**
   * Crée le formulaire avec les validateurs appropriés
   */
  private createForm(): FormGroup {
    return this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      localisation: ['', Validators.required],
      latitude: [null, [Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.min(-180), Validators.max(180)]]
    });
  }

  /**
   * Configure les effets du formulaire
   */
  private setupFormEffects(): void {
    // Effect pour valider automatiquement le formulaire
    effect(() => {
      if (this.machineForm.dirty) {
        this.validateForm();
      }
    });
  }

  /**
   * Charge les données de la machine en mode édition
   */
  private loadMachineData(): void {
    const id = this.machineId();
    if (!id) return;

    this.loading.set(true);
    
    forkJoin({
      games: this.gamesService.getAllGames(),
      machine: this.arcadesService.getArcadeById(id)
    }).subscribe({
      next: ({ games, machine }) => {
        this.handleDataLoaded(games, machine);
      },
      error: (error) => this.handleLoadError(error)
    });
  }

  /**
   * Charge uniquement les jeux (mode création)
   */
  private loadGamesOnly(): void {
    this.loading.set(true);
    
    this.gamesService.getAllGames().subscribe({
      next: (games) => {
        this.games.set(games);
        this.loading.set(false);
      },
      error: (error) => this.handleLoadError(error)
    });
  }

  /**
   * Traite les données chargées avec succès
   */
  private handleDataLoaded(games: Game[], machine?: Arcade): void {
    this.games.set(games);
    
    if (machine) {
      this.currentMachine.set(machine);
      this.patchFormWithMachine(machine);
    }
    
    this.loading.set(false);
  }

  /**
   * Gère les erreurs de chargement
   */
  private handleLoadError(error: any): void {
    console.error('Erreur lors du chargement:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données'
    });
    this.router.navigate(['/arcade-machines']);
  }

  /**
   * Remplit le formulaire avec les données de la machine
   */
  private patchFormWithMachine(machine: Arcade): void {
    this.machineForm.patchValue({
      nom: machine.nom,
      description: machine.description,
      localisation: machine.localisation,
      latitude: machine.latitude,
      longitude: machine.longitude
    });
  }

  /**
   * Valide le formulaire avec la stratégie de validation
   */
  private validateForm(): void {
    this.validationStrategy.validate(this.machineForm);
  }

  /**
   * Vérifie si un champ est invalide
   */
  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.machineForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Gère la soumission du formulaire
   */
  protected handleSubmit(): void {
    if (!this.canSubmit()) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.submitting.set(true);
    const formData = this.prepareFormData();
    
    const operation$ = this.isEditMode() 
      ? this.updateMachine(formData)
      : this.createMachine(formData);

    operation$.subscribe({
      next: () => this.handleSubmitSuccess(),
      error: (error: any) => this.handleSubmitError(error)
    });
  }

  /**
   * Marque tous les champs comme touchés pour déclencher la validation
   */
  private markAllFieldsAsTouched(): void {
    Object.keys(this.machineForm.controls).forEach(key => {
      this.machineForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Prépare les données du formulaire pour l'envoi
   */
  private prepareFormData(): MachineFormData {
    const formValue = this.machineForm.value;
    
    return {
      nom: formValue.nom,
      description: formValue.description || undefined,
      localisation: formValue.localisation,
      latitude: formValue.latitude || undefined,
      longitude: formValue.longitude || undefined
    };
  }

  /**
   * Crée une nouvelle machine
   */
  private createMachine(data: MachineFormData) {
    return this.arcadesService.createArcade(data);
  }

  /**
   * Met à jour une machine existante
   */
  private updateMachine(data: MachineFormData) {
    const id = this.machineId();
    if (!id) throw new Error('ID manquant pour la mise à jour');
    
    return this.arcadesService.updateArcade(id, data);
  }

  /**
   * Gère le succès de la soumission
   */
  private handleSubmitSuccess(): void {
    const action = this.isEditMode() ? 'modifiée' : 'créée';
    
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: `La borne a été ${action} avec succès`
    });
    
    this.router.navigate(['/arcade-machines']);
  }

  /**
   * Gère les erreurs de soumission
   */
  private handleSubmitError(error: any): void {
    console.error('Erreur lors de l\'enregistrement:', error);
    
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'enregistrer la borne'
    });
    
    this.submitting.set(false);
  }
}