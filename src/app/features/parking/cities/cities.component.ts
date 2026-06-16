import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_CITIES } from '../../../shared/mock-data';

@Component({
  selector: 'app-parking-cities',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Ciudades</h1>
      <ul class="list card" style="padding:0;overflow:hidden">
        @for (city of cities; track city) {
          <a routerLink="/app/parking/city-info" class="list-item">
            <div class="list-item-content"><div class="list-item-title">{{ city }}</div></div>
            <span class="list-item-chevron">›</span>
          </a>
        }
      </ul>
    </div>
  `,
})
export class ParkingCitiesComponent {
  readonly cities = MOCK_CITIES;
}
