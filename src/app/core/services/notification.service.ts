import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private messageService: MessageService) {}
  
  showSuccess(message: string, title: string = 'Succès'): void {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message
    });
  }
  
  showError(message: string, title: string = 'Erreur'): void {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message
    });
  }
  
  showInfo(message: string, title: string = 'Information'): void {
    this.messageService.add({
      severity: 'info',
      summary: title,
      detail: message
    });
  }
  
  showWarning(message: string, title: string = 'Attention'): void {
    this.messageService.add({
      severity: 'warn',
      summary: title,
      detail: message
    });
  }
}