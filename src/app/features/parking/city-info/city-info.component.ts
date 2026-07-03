import { Component, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { MOCK_MUNICIPIOS } from '../../../shared/mock-data';

@Component({
  selector: 'app-parking-city-info',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <a routerLink="/app/parking/cities" class="back-link">‹ Volver a municipios</a>
      <h1 class="page-title">{{ municipio.nombre }}</h1>
      <p class="page-subtitle">{{ municipio.provincia }}</p>
      <div class="card mt-2">
        <p><strong>{{ 'parking.zones' | translate }}:</strong> {{ municipio.zonas }}</p>
        <p class="text-muted mt-1"><strong>{{ 'parking.tariff' | translate }}:</strong> Desde 0,30 €/h</p>
      </div>
      <a [routerLink]="['/app/parking/streets']" [queryParams]="{city: municipio.id, cityName: municipio.nombre}" class="btn btn-primary btn-block mt-2">{{ 'parking.selectStreet' | translate }}</a>
    </div>
  `,
  styles: [`.back-link{display:inline-block;margin-bottom:1rem}`],
})
export class ParkingCityInfoComponent {
  private readonly route = inject(ActivatedRoute);
  readonly municipio = MOCK_MUNICIPIOS.find(
    m => m.id === this.route.snapshot.queryParamMap.get('id')
  ) ?? MOCK_MUNICIPIOS[1];
}
