// src/app/features/promos/promos.routes.ts

import { Routes } from '@angular/router';
import { LayoutComponent } from '../dashboard/layout/layout.component';
import { PromosListComponent } from './pages/promos-list/promos-list.component';
import { PromoFormComponent } from './pages/promo-form/promo-form.component';
import { PromosDetailsComponent } from './pages/promos-details/promos-details.component';

export const PROMOS_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { 
        path: '', 
        component: PromosListComponent,
        title: 'Codes Promotionnels - RetroNova'
      },
      { 
        path: 'new', 
        component: PromoFormComponent,
        title: 'Nouveau Code Promo - RetroNova'
      },
      { 
        path: 'edit/:id', 
        component: PromoFormComponent,
        title: 'Modifier Code Promo - RetroNova'
      },
      { 
        path: 'detail/:id', 
        component: PromosDetailsComponent,
        title: 'Détails Code Promo - RetroNova'
      }
    ]
  }
];