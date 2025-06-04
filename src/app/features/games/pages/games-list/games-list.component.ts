import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-games-list',
  standalone: true,
  imports: [CommonModule],
  template: `<div>Liste des jeux</div>`,
  styles: []
})
export class GamesListComponent {}