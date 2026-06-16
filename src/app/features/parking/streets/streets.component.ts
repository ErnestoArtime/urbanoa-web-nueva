import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_STREETS } from '../../../shared/mock-data';

@Component({
  selector: 'app-parking-streets',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Calles</h1>
      <div class="form-group">
        <input class="form-input" placeholder="Buscar calle..." />
      </div>
      <ul class="list card" style="padding:0;overflow:hidden">
        @for (street of streets; track street) {
          <a routerLink="/app/parking/tickets" class="list-item">
            <div class="list-item-content"><div class="list-item-title">{{ street }}</div></div>
            <span class="list-item-chevron">›</span>
          </a>
        }
      </ul>
    </div>
  `,
})
export class ParkingStreetsComponent {
  readonly streets = MOCK_STREETS;
}
