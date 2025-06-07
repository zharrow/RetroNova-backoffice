import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule],
  template: `
    <p-toast position="bottom-right" [style]="{marginTop: '70px'}"></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <router-outlet></router-outlet>
  `,
  styles: []
})
export class AppComponent {
  title = 'Retro Nova - Back Office';
}