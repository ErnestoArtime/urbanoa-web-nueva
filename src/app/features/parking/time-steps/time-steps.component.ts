import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-parking-time-steps',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Duración</h1>
      <p class="page-subtitle">Selecciona el tiempo de aparcamiento</p>
      <div class="chip-row">
        @for (t of times; track t) {
          <button type="button" class="chip" [class.active]="t === selected" (click)="selected = t">{{ t }}</button>
        }
      </div>
      <div class="card mt-2 text-center">
        <p class="text-muted">Importe estimado</p>
        <p style="font-size:1.5rem;font-weight:700;color:var(--color-primary)">1,20 €</p>
      </div>
      <a routerLink="/app/parking/confirm" class="btn btn-primary btn-block mt-2">Siguiente</a>
    </div>
  `,
})
export class ParkingTimeStepsComponent {
  readonly times = ['30 min', '1 h', '1 h 30', '2 h', '3 h'];
  selected = '1 h';
}
