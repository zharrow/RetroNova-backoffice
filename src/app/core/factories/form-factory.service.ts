import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Stratégies de validation
interface ValidationStrategy {
  getValidators(): any[];
}

class GameValidationStrategy implements ValidationStrategy {
  getValidators() {
    return [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50)
    ];
  }
}

@Injectable({ providedIn: 'root' })
export class FormFactory {
  private readonly fb = inject(FormBuilder);
  
  createGameForm(): FormGroup {
    const strategy = new GameValidationStrategy();
    
    return this.fb.group({
      nom: ['', strategy.getValidators()],
      description: [''],
      min_players: [1, [Validators.required, Validators.min(1)]],
      max_players: [2, [Validators.required, Validators.min(1)]]
    });
  }
  
  createArcadeForm(): FormGroup {
    return this.fb.group({
      nom: ['', [Validators.required]],
      localisation: ['', [Validators.required]],
      latitude: [null],
      longitude: [null]
    });
  }
}