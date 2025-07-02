// src/app/features/arcade-machines/pages/machine-form/machine-form.component.ts

import { Component, OnInit, inject, signal, computed, effect, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { ArcadesService } from '../../../../core/services/arcades.service';
import { GamesService } from '../../../../core/services/games.service';
import { Arcade, ArcadeCreate, ArcadeUpdate, ArcadeGameAssignment } from '../../../../core/models/arcade.model';
import { Game } from '../../../../core/models/game.model';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { toSignal } from '@angular/core/rxjs-interop';

interface GameOption {
  readonly label: string;
  readonly value: number;
  readonly game: Game | null;
}

// --- Validation Strategy ---
abstract class FormValidationStrategy {
  abstract validate(form: FormGroup): boolean;
  abstract getErrors(form: FormGroup): string[];
}

class MachineFormValidationStrategy extends FormValidationStrategy {
  validate(form: FormGroup): boolean {
    return form.valid && this.validateSlots(form);
  }

  getErrors(form: FormGroup): string[] {
    const errors: string[] = [];
    if (form.get('nom')?.hasError('required')) errors.push('Le nom de la borne est requis');
    if (form.get('localisation')?.hasError('required')) errors.push('La localisation est requise');
    
    const slotsErrors = this.validateSlotsErrors(form);
    errors.push(...slotsErrors);
    
    return errors;
  }

  private validateSlots(form: FormGroup): boolean {
    const slotsArray = form.get('slots') as FormArray;
    if (!slotsArray) return true;
    
    const assignedGames = slotsArray.controls
      .map(control => control.get('game_id')?.value)
      .filter(gameId => gameId !== null);
    
    // Vérifier qu'il n'y a pas de doublons
    const uniqueGames = new Set(assignedGames);
    return uniqueGames.size === assignedGames.length;
  }

  private validateSlotsErrors(form: FormGroup): string[] {
    const errors: string[] = [];
    const slotsArray = form.get('slots') as FormArray;
    
    if (slotsArray) {
      const assignedGames = slotsArray.controls
        .map(control => control.get('game_id')?.value)
        .filter(gameId => gameId !== null);
      
      const uniqueGames = new Set(assignedGames);
      if (uniqueGames.size !== assignedGames.length) {
        errors.push('Un même jeu ne peut pas être assigné à plusieurs slots');
      }
    }
    
    return errors;
  }
}

// --- Factory ---
class GameOptionsFactory {
  static createOptions(games: Game[]): GameOption[] {
    return [
      { label: 'Aucun jeu sélectionné', value: 0, game: null },
      ...games.map(game => ({
        label: `${game.nom} (${game.min_players}-${game.max_players} joueurs) - ${game.ticket_cost} tickets`,
        value: game.id,
        game
      }))
    ];
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
    DividerModule,
    MessageModule,
    ConfirmDialogModule,
    LoaderComponent
  ],
  providers: [ConfirmationService],
  template: `
    <div class="page-container animate-fade-in">
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <i class="pi pi-desktop neon-glow"></i>
            {{ pageTitle() }}
          </h1>
          <p class="page-subtitle">
            {{ isEditMode() ? 'Modifiez les informations et la configuration' : 'Créez une nouvelle borne d\'arcade' }}
          </p>
        </div>
      </div>

      <div class="form-container">
        @if (loading()) {
          <app-loader size="large">
            <div class="loading-content">
              <i class="pi pi-spin pi-cog loading-icon"></i>
              <span>{{ isEditMode() ? 'Chargement de la borne...' : 'Chargement du formulaire...' }}</span>
            </div>
          </app-loader>
        } @else {
          <form [formGroup]="machineForm" (ngSubmit)="handleSubmit()" class="machine-form">
            
            <!-- Section informations générales -->
            <p-card header="Informations générales" styleClass="form-section">
              <ng-template pTemplate="header">
                <div class="section-header">
                  <i class="pi pi-info-circle"></i>
                  <span>Informations générales</span>
                </div>
              </ng-template>
              
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
                    placeholder="Ex: Borne Rétro Zone 1"
                    class="gaming-input" />
                  @if (isFieldInvalid('nom')) {
                    <small class="p-error">Le nom de la borne est requis (minimum 2 caractères)</small>
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
                    placeholder="Description de la borne (optionnel)"
                    class="gaming-input">
                  </textarea>
                </div>
              </div>
            </p-card>

            <!-- Section localisation -->
            <p-card header="Localisation" styleClass="form-section">
              <ng-template pTemplate="header">
                <div class="section-header">
                  <i class="pi pi-map-marker"></i>
                  <span>Localisation</span>
                </div>
              </ng-template>
              
              <div class="form-grid">
                <!-- Localisation -->
                <div class="form-group col-12">
                  <label for="localisation" class="required">Emplacement</label>
                  <input 
                    id="localisation" 
                    type="text" 
                    pInputText 
                    formControlName="localisation"
                    [class.ng-invalid]="isFieldInvalid('localisation')"
                    placeholder="Ex: Salle principale, près de l'entrée"
                    class="gaming-input" />
                  @if (isFieldInvalid('localisation')) {
                    <small class="p-error">La localisation est requise</small>
                  }
                </div>

                <!-- Coordonnées GPS -->
                <div class="form-group col-6">
                  <label for="latitude">Latitude</label>
                  <input 
                    id="latitude" 
                    type="number" 
                    pInputText 
                    formControlName="latitude"
                    [class.ng-invalid]="isFieldInvalid('latitude')"
                    step="0.000001"
                    placeholder="48.8566"
                    class="gaming-input" />
                  @if (isFieldInvalid('latitude')) {
                    <small class="p-error">La latitude doit être entre -90 et 90</small>
                  }
                </div>

                <div class="form-group col-6">
                  <label for="longitude">Longitude</label>
                  <input 
                    id="longitude" 
                    type="number" 
                    pInputText 
                    formControlName="longitude"
                    [class.ng-invalid]="isFieldInvalid('longitude')"
                    step="0.000001"
                    placeholder="2.3522"
                    class="gaming-input" />
                  @if (isFieldInvalid('longitude')) {
                    <small class="p-error">La longitude doit être entre -180 et 180</small>
                  }
                </div>
              </div>
            </p-card>

            <!-- Section configuration des jeux -->
            <p-card header="Configuration des jeux" styleClass="form-section slots-section">
              <ng-template pTemplate="header">
                <div class="section-header">
                  <i class="pi pi-gamepad"></i>
                  <span>Configuration des jeux</span>
                </div>
              </ng-template>
              
              <div class="slots-configuration">
                <p class="section-description">
                  Chaque borne dispose de 2 slots pour les jeux. Vous pouvez assigner un jeu différent à chaque slot ou laisser des slots libres.
                </p>
                
                <div formArrayName="slots" class="slots-grid">
                  @for (slotControl of slotsArray.controls; track $index; let i = $index) {
                    <div [formGroupName]="i" class="slot-card">
                      <div class="slot-header">
                        <div class="slot-number">
                          <span class="slot-label">Slot {{ i + 1 }}</span>
                          <div class="slot-indicator" [class]="getSlotIndicatorClass(i)">
                            <i [class]="getSlotIcon(i)"></i>
                          </div>
                        </div>
                        @if (getSelectedGameForSlot(i); as selectedGame) {
                          <div class="slot-status occupied">
                            <span class="status-label">Occupé</span>
                          </div>
                        } @else {
                          <div class="slot-status empty">
                            <span class="status-label">Libre</span>
                          </div>
                        }
                      </div>
                      
                      <div class="slot-content">
                        <div class="form-group">
                          <label [for]="'game_' + i">Jeu assigné</label>
                          <p-dropdown 
                            [id]="'game_' + i"
                            formControlName="game_id"
                            [options]="gameOptions()"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Sélectionner un jeu"
                            [showClear]="true"
                            styleClass="gaming-dropdown w-full"
                            (onChange)="onGameSlotChange(i, $event)">
                            
                            <ng-template pTemplate="selectedItem" let-option>
                              @if (option && option.game) {
                                <div class="selected-game">
                                  <span class="game-name">{{ option.game.nom }}</span>
                                  <span class="game-meta">{{ option.game.min_players }}-{{ option.game.max_players }} joueurs</span>
                                </div>
                              } @else {
                                <span class="no-game">Aucun jeu sélectionné</span>
                              }
                            </ng-template>
                            
                            <ng-template pTemplate="item" let-option>
                              @if (option.game) {
                                <div class="game-option">
                                  <div class="game-info">
                                    <span class="game-name">{{ option.game.nom }}</span>
                                    <span class="game-description">{{ option.game.description || 'Aucune description' }}</span>
                                  </div>
                                  <div class="game-meta">
                                    <span class="players">{{ option.game.min_players }}-{{ option.game.max_players }} joueurs</span>
                                    <span class="cost">{{ option.game.ticket_cost }} tickets</span>
                                  </div>
                                </div>
                              } @else {
                                <div class="no-game-option">
                                  <i class="pi pi-times"></i>
                                  <span>Aucun jeu</span>
                                </div>
                              }
                            </ng-template>
                          </p-dropdown>
                        </div>
                        
                        @if (getSelectedGameForSlot(i); as selectedGame) {
                          <div class="game-details">
                            <div class="detail-item">
                              <i class="pi pi-users"></i>
                              <span>{{ selectedGame.min_players }}-{{ selectedGame.max_players }} joueurs</span>
                            </div>
                            <div class="detail-item">
                              <i class="pi pi-ticket"></i>
                              <span>{{ selectedGame.ticket_cost }} tickets</span>
                            </div>
                            @if (selectedGame.description) {
                              <div class="game-description">
                                <i class="pi pi-info-circle"></i>
                                <span>{{ selectedGame.description }}</span>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
                
                @if (hasSlotConflicts()) {
                  <p-message severity="error" styleClass="slot-error">
                    <span>Erreur: Un même jeu ne peut pas être assigné à plusieurs slots</span>
                  </p-message>
                }
              </div>
            </p-card>

            <!-- Erreurs de validation globales -->
            @if (formValidationErrors().length > 0 && machineForm.touched) {
              <p-card styleClass="validation-errors-card">
                <div class="validation-errors">
                  <h4>
                    <i class="pi pi-exclamation-triangle"></i>
                    Erreurs de validation
                  </h4>
                  <ul>
                    @for (error of formValidationErrors(); track error) {
                      <li>{{ error }}</li>
                    }
                  </ul>
                </div>
              </p-card>
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
                routerLink="/arcade-machines"
                class="action-btn">
              </button>
              
              @if (isEditMode()) {
                <button 
                  pButton 
                  pRipple 
                  type="button" 
                  label="Réinitialiser" 
                  severity="danger"
                  outlined
                  (click)="resetForm()"
                  class="action-btn">
                </button>
              }
              
              <button 
                pButton 
                pRipple 
                type="submit" 
                [label]="isEditMode() ? 'Mettre à jour' : 'Créer la borne'"
                [loading]="submitting()" 
                [disabled]="!canSubmit()"
                severity="success"
                class="gaming-button">
              </button>
            </div>
          </form>
        }
      </div>
    </div>
    
    <p-confirmDialog 
      header="Confirmation" 
      icon="pi pi-question-circle"
      styleClass="gaming-confirm-dialog">
    </p-confirmDialog>
  `,
  styleUrls: ['./machine-form.component.scss']
})
export class MachineFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly arcadesService = inject(ArcadesService);
  private readonly gamesService = inject(GamesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly validationStrategy = new MachineFormValidationStrategy();

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly machineId = signal<number | null>(null);
  readonly currentMachine = signal<Arcade | null>(null);
  readonly games = signal<Game[]>([]);

  // Ces propriétés seront initialisées dans le constructeur
  readonly formStatus!: Signal<string | undefined>;
  readonly canSubmit!: Signal<boolean>;

  readonly isEditMode = computed(() => !!this.machineId());
  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Modifier la borne' : 'Nouvelle borne d\'arcade'
  );
  
  readonly gameOptions = computed(() =>
    GameOptionsFactory.createOptions(this.games())
  );

  // Ces propriétés dépendent du formulaire et seront initialisées dans le constructeur
  readonly formValidationErrors!: Signal<string[]>;
  readonly hasSlotConflicts!: Signal<boolean>;

  protected readonly machineForm: FormGroup;
  protected readonly slotsArray: FormArray;

  constructor() {
    // Créer le formulaire d'abord
    this.machineForm = this.createForm();
    this.slotsArray = this.machineForm.get('slots') as FormArray;
    
    // Initialiser les propriétés qui dépendent du formulaire
    this.formStatus = toSignal(this.machineForm.statusChanges, { 
      initialValue: this.machineForm.status 
    });
    
    this.formValidationErrors = computed(() =>
      this.validationStrategy.getErrors(this.machineForm)
    );
    
    this.hasSlotConflicts = computed(() => {
      const slotsArray = this.machineForm.get('slots') as FormArray;
      if (!slotsArray) return false;
      
      const assignedGames = slotsArray.controls
        .map(control => control.get('game_id')?.value)
        .filter(gameId => gameId && gameId !== 0);
      
      const uniqueGames = new Set(assignedGames);
      return uniqueGames.size !== assignedGames.length;
    });
    
    this.canSubmit = computed(() => {
      const isValid = this.formStatus() === 'VALID';
      const notSubmitting = !this.submitting();
      const noConflicts = !this.hasSlotConflicts();
      return isValid && notSubmitting && noConflicts;
    });
  }

  ngOnInit(): void {
    this.initializeComponent();
  }
  
  private initializeComponent(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.machineId.set(+id);
      this.loadMachineData();
    } else {
      this.loadGamesOnly();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      localisation: ['', Validators.required],
      latitude: [null, [Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.min(-180), Validators.max(180)]],
      slots: this.fb.array([
        this.createSlotFormGroup(1),
        this.createSlotFormGroup(2)
      ])
    });
  }

  private createSlotFormGroup(slotNumber: number): FormGroup {
    return this.fb.group({
      slot_number: [slotNumber],
      game_id: [0]
    });
  }

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

  private handleDataLoaded(games: Game[], machine?: Arcade): void {
    this.games.set(games);
    if (machine) {
      this.currentMachine.set(machine);
      this.patchFormWithMachine(machine);
    }
    this.loading.set(false);
  }

  private handleLoadError(error: any): void {
    console.error('Erreur lors du chargement:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données'
    });
    this.router.navigate(['/arcade-machines']);
  }

  private patchFormWithMachine(machine: Arcade): void {
    this.machineForm.patchValue({
      nom: machine.nom,
      description: machine.description || '',
      localisation: machine.localisation,
      latitude: machine.latitude,
      longitude: machine.longitude
    });

    // Réinitialiser les slots
    this.slotsArray.controls.forEach((control, index) => {
      control.patchValue({ game_id: 0 });
    });

    // Patcher les slots avec les jeux assignés
    if (machine.games && machine.games.length > 0) {
      machine.games.forEach(gameAssignment => {
        const slotIndex = gameAssignment.slot_number - 1;
        if (slotIndex >= 0 && slotIndex < this.slotsArray.length) {
          this.slotsArray.at(slotIndex).patchValue({
            game_id: gameAssignment.id
          });
        }
      });
    }
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.machineForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  protected onGameSlotChange(slotIndex: number, event: any): void {
    const gameId = event.value;
    if (!gameId || gameId === 0) return;
    
    const selectedGame = this.games().find(game => game.id === gameId);
    
    if (selectedGame) {
      this.messageService.add({
        severity: 'info',
        summary: 'Jeu assigné',
        detail: `${selectedGame.nom} assigné au slot ${slotIndex + 1}`
      });
    }
  }

  protected getSelectedGameForSlot(slotIndex: number): Game | null {
    const gameId = this.slotsArray.at(slotIndex).get('game_id')?.value;
    if (!gameId || gameId === 0) return null;
    
    return this.games().find(game => game.id === gameId) || null;
  }

  protected getSlotIndicatorClass(slotIndex: number): string {
    const hasGame = !!this.getSelectedGameForSlot(slotIndex);
    return hasGame ? 'occupied' : 'empty';
  }

  protected getSlotIcon(slotIndex: number): string {
    const hasGame = !!this.getSelectedGameForSlot(slotIndex);
    return hasGame ? 'pi pi-check' : 'pi pi-plus';
  }

  protected resetForm(): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir réinitialiser le formulaire ? Toutes les modifications seront perdues.',
      header: 'Confirmation de réinitialisation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-warning',
      rejectButtonStyleClass: 'p-button-text',
      acceptLabel: 'Réinitialiser',
      rejectLabel: 'Annuler',
      accept: () => {
        if (this.currentMachine()) {
          this.patchFormWithMachine(this.currentMachine()!);
        } else {
          this.machineForm.reset();
          // Réinitialiser les slots
          this.slotsArray.controls.forEach((control, index) => {
            control.patchValue({ 
              slot_number: index + 1,
              game_id: 0 
            });
          });
        }
        this.messageService.add({
          severity: 'info',
          summary: 'Formulaire réinitialisé',
          detail: 'Le formulaire a été remis à son état initial'
        });
      }
    });
  }

  protected handleSubmit(): void {
    if (!this.canSubmit()) {
      this.markAllFieldsAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulaire invalide',
        detail: 'Veuillez corriger les erreurs avant de continuer'
      });
      return;
    }

    this.submitting.set(true);
    
    if (this.isEditMode()) {
      this.updateMachine();
    } else {
      this.createMachine();
    }
  }

  private markAllFieldsAsTouched(): void {
    this.machineForm.markAllAsTouched();
  }

  private prepareArcadeData(): ArcadeCreate {
    const formValue = this.machineForm.value;
    
    // Préparer les données selon l'interface ArcadeCreate
    const arcadeData: ArcadeCreate = {
      nom: formValue.nom.trim(),
      description: formValue.description?.trim() || undefined,
      localisation: formValue.localisation.trim()
    };

    // Ajouter latitude/longitude seulement si elles sont définies
    if (formValue.latitude !== null && formValue.latitude !== undefined) {
      arcadeData.latitude = Number(formValue.latitude);
    }
    if (formValue.longitude !== null && formValue.longitude !== undefined) {
      arcadeData.longitude = Number(formValue.longitude);
    }

    return arcadeData;
  }

  private prepareGameAssignments(arcadeId: number): ArcadeGameAssignment[] {
    const formValue = this.machineForm.value;
    
    return formValue.slots
      .filter((slot: any) => slot.game_id && slot.game_id !== 0)
      .map((slot: any) => ({
        arcade_id: arcadeId,
        game_id: Number(slot.game_id),
        slot_number: Number(slot.slot_number)
      }));
  }

  private createMachine(): void {
    const arcadeData = this.prepareArcadeData();
    
    this.arcadesService.createArcade(arcadeData).subscribe({
      next: (response) => {
        // Assigner les jeux si nécessaire
        const gameAssignments = this.prepareGameAssignments(response.id);
        
        if (gameAssignments.length > 0) {
          this.assignGamesToArcade(response.id, gameAssignments);
        } else {
          this.handleSubmitSuccess('créée');
        }
      },
      error: (error) => this.handleSubmitError(error)
    });
  }

  private updateMachine(): void {
    const id = this.machineId();
    if (!id) return;

    const arcadeData: ArcadeUpdate = this.prepareArcadeData();
    
    this.arcadesService.updateArcade(id, arcadeData).subscribe({
      next: () => {
        // Gérer les assignations de jeux
        const gameAssignments = this.prepareGameAssignments(id);
        
        // Note: Dans une vraie application, il faudrait gérer la suppression 
        // des anciennes assignations avant d'ajouter les nouvelles
        if (gameAssignments.length > 0) {
          this.assignGamesToArcade(id, gameAssignments);
        } else {
          this.handleSubmitSuccess('modifiée');
        }
      },
      error: (error) => this.handleSubmitError(error)
    });
  }

  private assignGamesToArcade(arcadeId: number, assignments: ArcadeGameAssignment[]): void {
    // Envoyer chaque assignation séparément ou en lot selon l'API
    const requests = assignments.map(assignment => 
      this.arcadesService.assignGameToArcade(assignment)
    );

    if (requests.length === 0) {
      this.handleSubmitSuccess(this.isEditMode() ? 'modifiée' : 'créée');
      return;
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.handleSubmitSuccess(this.isEditMode() ? 'modifiée' : 'créée');
      },
      error: (error) => this.handleSubmitError(error)
    });
  }

  private handleSubmitSuccess(action: string): void {
    this.submitting.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: `La borne a été ${action} avec succès`
    });
    this.router.navigate(['/arcade-machines']);
  }

  private handleSubmitError(error: any): void {
    console.error('Erreur lors de l\'enregistrement:', error);
    this.submitting.set(false);
    
    let errorMessage = 'Impossible d\'enregistrer la borne';
    
    if (error.status === 422) {
      errorMessage = 'Les données envoyées sont invalides. Vérifiez les champs du formulaire.';
      if (error.error?.detail) {
        errorMessage = error.error.detail;
      }
    }
    
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: errorMessage,
      life: 5000
    });
  }
}