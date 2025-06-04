import { Component, Input } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {
  title: string;
  message: string;
  
  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.title = this.config.data?.title || 'Confirmation';
    this.message = this.config.data?.message || 'Êtes-vous sûr ?';
  }
  
  confirm(): void {
    this.ref.close(true);
  }
  
  cancel(): void {
    this.ref.close(false);
  }
}