import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { HomeComponent } from './pages/home/home.component';
import { LayoutComponent } from './layout/layout.component';
import { MachinesListComponent } from '../arcade-machines/pages/machines-list/machines-list.component';

const routes: Routes = [
  {
    path: '',
    component: MachinesListComponent,
    // component: LayoutComponent,
    // children: [
    //   { path: '', component: HomeComponent }
    // ]
  }
];

@NgModule({
  // declarations: [
  //   HomeComponent,
  //   LayoutComponent
  // ],
  // imports: [
  //   SharedModule,
  //   RouterModule.forChild(routes)
  // ]
})
export class DashboardModule { }