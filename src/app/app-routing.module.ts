import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'arcade-machines',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/arcade-machines/arcade-machines.module').then(m => m.ArcadeMachinesModule)
  },
  {
    path: 'games',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/games/games.module').then(m => m.GamesModule)
  },
  {
    path: 'users',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/users/users.module').then(m => m.UsersModule)
  },
  {
    path: 'statistics',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/statistics/statistics.module').then(m => m.StatisticsModule)
  },
  {
    path: 'parties',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/parties/parties.module').then(m => m.PartiesModule)
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }