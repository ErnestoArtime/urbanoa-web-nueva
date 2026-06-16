import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-report',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Informe de operaciones</h1>
      <p class="page-subtitle">Selecciona el rango de fechas</p>
      <div class="chip-row">
        @for (r of ranges; track r) {
          <span class="chip">{{ r }}</span>
        }
      </div>
      <div class="form-group mt-2">
        <label class="form-label">Desde</label>
        <input class="form-input" type="date" />
      </div>
      <div class="form-group">
        <label class="form-label">Hasta</label>
        <input class="form-input" type="date" />
      </div>
      <a routerLink="/app/operations/report-success" class="btn btn-primary btn-block mt-2">Generar informe</a>
    </div>
  `,
})
export class ReportComponent {
  readonly ranges = ['Últimos 7 días', 'Últimos 30 días', 'Últimos 14 días'];
}
