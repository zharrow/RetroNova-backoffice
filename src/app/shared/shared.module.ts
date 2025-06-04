import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';

// Components
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { LoaderComponent } from './components/loader/loader.component';

@NgModule({
  declarations: [
    HeaderComponent,
    SidebarComponent,
    ConfirmationDialogComponent,
    LoaderComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    InputSwitchModule,
    DialogModule,
    ProgressSpinnerModule,
    ToastModule,
    MenuModule,
    DynamicDialogModule,
    ConfirmDialogModule,
    TooltipModule,
    RippleModule
  ],
  exports: [
    // Modules
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    
    // PrimeNG Components
    ButtonModule,
    CardModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    InputSwitchModule,
    DialogModule,
    ProgressSpinnerModule,
    ToastModule,
    MenuModule,
    DynamicDialogModule,
    ConfirmDialogModule,
    TooltipModule,
    RippleModule,
    
    // Custom Components
    HeaderComponent,
    SidebarComponent,
    ConfirmationDialogComponent,
    LoaderComponent
  ]
})
export class SharedModule { }