import { Routes } from '@angular/router';
import { LayoutComponent } from '../dashboard/layout/layout.component';
import { PartiesListComponent } from './pages/parties-list/parties-list.component';

export const PARTIES_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: PartiesListComponent }
    ]
  }
];