import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

// Strategy pattern pour différents types d'erreurs
abstract class ErrorStrategy {
  abstract handle(error: Error): void;
}

class NetworkErrorStrategy extends ErrorStrategy {
  handle(error: Error): void {
    console.error('Network error:', error);
    // Afficher notification
  }
}

class ValidationErrorStrategy extends ErrorStrategy {
  handle(error: Error): void {
    console.error('Validation error:', error);
    // Afficher les erreurs de validation
  }
}

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private readonly router = inject(Router);
  private strategies = new Map<string, ErrorStrategy>();
  
  constructor() {
    this.registerStrategies();
  }
  
  private registerStrategies(): void {
    this.strategies.set('network', new NetworkErrorStrategy());
    this.strategies.set('validation', new ValidationErrorStrategy());
  }
  
  handleError(error: Error | HttpErrorResponse): void {
    const strategy = this.getStrategy(error);
    strategy.handle(error);
  }
  
  private getStrategy(error: Error): ErrorStrategy {
    if (error instanceof HttpErrorResponse) {
      return this.strategies.get('network')!;
    }
    return this.strategies.get('validation')!;
  }
}