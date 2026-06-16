import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_TARIFFS } from '../../../shared/mock-data';

@Component({
  selector: 'app-parking-tickets',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Seleccionar tarifa</h1>
      <ul class="list card" style="padding:0;overflow:hidden">
        @for (t of tariffs; track t.id) {
          <a routerLink="/app/parking/time-steps" class="list-item">
            <div class="list-item-content">
              <div class="list-item-title">{{ t.name }}</div>
              <div class="list-item-subtitle">{{ t.desc }} — {{ t.price }}</div>
            </div>
            <span class="list-item-chevron">›</span>
          </a>
        }
      </ul>
    </div>
  `,
})
export class ParkingTicketsComponent {
  readonly tariffs = MOCK_TARIFFS;
}
