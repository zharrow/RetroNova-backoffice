import { Routes } from '@angular/router';
import { LayoutComponent } from '../dashboard/layout/layout.component';
import { ReservationsListComponent } from './pages/reservations-list/reservations-list.component';

export const RESERVATIONS_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: ReservationsListComponent }
    ]
  }
];