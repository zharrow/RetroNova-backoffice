import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule],
  template: `<div>Détails de l'utilisateur</div>`,
  styles: []
})
export class UserDetailComponent {}