import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-report-success',
  imports: [RouterLink],
  template: `
    <div class="page text-center">
      <div class="success-icon">✓</div>
      <h1 class="page-title">Informe generado</h1>
      <p class="page-subtitle">Hemos enviado el informe a tu correo electrónico.</p>
      <a routerLink="/app/operations" class="btn btn-primary btn-block mt-2">Volver a operaciones</a>
    </div>
  `,
})
export class ReportSuccessComponent {}
