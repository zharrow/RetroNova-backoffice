import { Routes } from '@angular/router';
import { LayoutComponent } from '../dashboard/layout/layout.component';
import { PromosListComponent } from './pages/promos-list/promos-list.component';

export const PROMOS_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: PromosListComponent }
    ]
  }
];