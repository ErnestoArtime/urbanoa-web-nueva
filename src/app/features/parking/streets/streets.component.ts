import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { MOCK_STREETS_ZARAUTZ } from '../../../shared/mock-data';

@Component({
  selector: 'app-parking-streets',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <a [routerLink]="['/app/parking/city-info']" [queryParams]="{id: cityId}" class="back-link">{{ 'parking.streets.back' | translate }}</a>
      <h1 class="page-title">{{ 'parking.selectStreet' | translate }}</h1>
      <div class="form-group">
        <input class="form-input" [placeholder]="('parking.selectStreet' | translate)" />
      </div>
      <ul class="list card" style="padding:0;overflow:hidden">
        @for (street of streets; track street.nombre) {
          <a [routerLink]="['/app/parking/tickets']" [queryParams]="streetParams(street)" class="list-item">
            <div class="list-item-content">
              <div class="list-item-title">{{ street.nombre }}</div>
              <div class="list-item-subtitle">{{ street.zona }} · {{ street.tarifa }}</div>
            </div>
            <span class="list-item-chevron">›</span>
          </a>
        }
      </ul>
    </div>
  `,
  styles: [`.back-link{display:inline-block;margin-bottom:1rem}`],
})
export class ParkingStreetsComponent {
  private readonly route = inject(ActivatedRoute);
  readonly streets = MOCK_STREETS_ZARAUTZ;
  readonly cityId = this.route.snapshot.queryParamMap.get('city') ?? 'zarautz';
  readonly cityName = this.route.snapshot.queryParamMap.get('cityName') ?? 'Zarautz';
  readonly plate = this.route.snapshot.queryParamMap.get('plate') ?? '1234 ABC';

  streetParams(street: typeof MOCK_STREETS_ZARAUTZ[number]): Record<string, string> {
    return {
      city: this.cityId,
      cityName: this.cityName,
      cityId: this.cityId,
      plate: this.plate,
      zoneId: '1',
      zone: street.zona,
      street: street.nombre,
      sector: street.zona,
      sectorColor: '3f51b5',
      sectorId: '1',
      ticketId: '1',
      latitude: '0',
      longitude: '0',
    };
  }
}
