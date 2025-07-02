// src/app/shared/pipes/math.pipe.ts

import { Pipe, PipeTransform } from '@angular/core';

type MathOperation = 
  | 'round'
  | 'floor' 
  | 'ceil'
  | 'abs'
  | 'min'
  | 'max'
  | 'pow'
  | 'sqrt'
  | 'random';

@Pipe({
  name: 'math',
  standalone: true,
  pure: true
})
export class MathPipe implements PipeTransform {
  transform(value: number | null | undefined, operation: MathOperation, ...args: number[]): number {
    // Gestion des valeurs nulles/undefined
    if (value === null || value === undefined || isNaN(value)) {
      return 0;
    }

    switch (operation) {
      case 'round':
        return Math.round(value);
      
      case 'floor':
        return Math.floor(value);
      
      case 'ceil':
        return Math.ceil(value);
      
      case 'abs':
        return Math.abs(value);
      
      case 'min':
        return Math.min(value, ...args);
      
      case 'max':
        return Math.max(value, ...args);
      
      case 'pow':
        const exponent = args[0] || 2;
        return Math.pow(value, exponent);
      
      case 'sqrt':
        return Math.sqrt(value);
      
      case 'random':
        // Retourne un nombre aléatoire entre 0 et value
        return Math.random() * value;
      
      default:
        return value;
    }
  }
}