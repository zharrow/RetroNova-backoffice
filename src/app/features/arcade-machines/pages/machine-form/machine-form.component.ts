import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
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
    InputTextarea,
    DropdownModule,
    CardModule,
    RippleModule,
    LoaderComponent
  ],
  templateUrl: './machine-form.component.html',
  styleUrl: "./machine-form.component.scss",
})
export class MachineFormComponent implements OnInit {
  machineForm: FormGroup;
  isEditMode = false;
  loading = false;
  submitting = false;
  machineId?: number;
  
  games: Game[] = [];
  gameOptions: GameOption[] = [];
  filteredGame2Options: GameOption[] = [];
  
  constructor(
    private fb: FormBuilder,
    private arcadesService: ArcadesService,
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
    
    if (this.isEditMode && this.machineId) {
      this.loadInitialData();
    }
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
    
    if (this.isEditMode && this.machineId) {
      // Charger les jeux et la machine en parallèle
      forkJoin({
        games: this.gamesService.getAllGames(),
        machine: this.arcadesService.getArcadeById(this.machineId)
      }).subscribe({
        next: ({ games, machine }) => {
          this.games = games;
          this.setupGameOptions();
          this.patchFormWithMachine(machine);
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
    } else {
      // Charger seulement les jeux
      this.gamesService.getAllGames().subscribe({
        next: (games) => {
          this.games = games;
          this.setupGameOptions();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des jeux:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger les jeux'
          });
          this.loading = false;
        }
      });
    }
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