import { Routes } from '@angular/router';
import { LayoutComponent } from '../dashboard/layout/layout.component';
import { MachinesListComponent } from './pages/machines-list/machines-list.component';
import { MachineDetailComponent } from './pages/machine-detail/machine-detail.component';
import { MachineFormComponent } from './pages/machine-form/machine-form.component';

export const ARCADE_MACHINES_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: MachinesListComponent },
      { path: 'new', component: MachineFormComponent },
      { path: 'edit/:id', component: MachineFormComponent },
      { path: 'detail/:id', component: MachineDetailComponent },
      { path: ':id', component: MachineDetailComponent }
    ]
  }
];