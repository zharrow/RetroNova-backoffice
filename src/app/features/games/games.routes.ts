import { Routes } from '@angular/router';
import { LayoutComponent } from '../dashboard/layout/layout.component';
import { GamesListComponent } from './pages/games-list/games-list.component';
import { GameFormComponent } from './pages/game-form/game-form.component';

export const GAMES_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: GamesListComponent },
      { path: 'new', component: GameFormComponent },
      { path: 'edit/:id', component: GameFormComponent },
    ]
  }
];