import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';


export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: 'arcade-machines',
    canActivate: [authGuard],
    loadChildren: () => import('./features/arcade-machines/arcade-machines.routes').then(m => m.ARCADE_MACHINES_ROUTES)
  },
  {
    path: 'games',
    canActivate: [authGuard],
    loadChildren: () => import('./features/games/games.routes').then(m => m.GAMES_ROUTES)
  },
  {
    path: 'users',
    canActivate: [authGuard],
    loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES)
  },
  {
    path: 'statistics',
    canActivate: [authGuard],
    loadChildren: () => import('./features/statistics/statistics.routes').then(m => m.STATISTICS_ROUTES)
  },
  {
    path: 'parties',
    canActivate: [authGuard],
    loadChildren: () => import('./features/parties/parties.routes').then(m => m.PARTIES_ROUTES)
  },
  { path: '**', redirectTo: '' }
];