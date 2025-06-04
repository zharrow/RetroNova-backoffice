import { Routes } from '@angular/router';
import { LayoutComponent } from '../dashboard/layout/layout.component';
import { StatisticsDashboardComponent } from './pages/statistics-dashboard/statistics-dashboard.component';

export const STATISTICS_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: StatisticsDashboardComponent }
    ]
  }
];