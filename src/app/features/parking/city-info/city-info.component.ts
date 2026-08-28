import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CitiesService, type ParkingMunicipio } from '../../../core/services/cities.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ParkingFlowStore } from '../parking-flow.store';

@Component({
  selector: 'app-parking-city-info',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <a routerLink="/app/parking/cities" class="back-link">{{ 'parking.cityInfo.back' | translate }}</a>
      @if (municipio(); as city) {
        <h1 class="page-title">{{ city.nombre }}</h1>
        <p class="page-subtitle">{{ city.description1 }}</p>
        <div class="card mt-2">
          @if (city.address) { <p><strong>Dirección:</strong> {{ city.address }}</p> }
          @if (city.phone) { <p><strong>Teléfono:</strong> {{ city.phone }}</p> }
          @if (city.email) { <p><strong>Email:</strong> {{ city.email }}</p> }
        </div>
        <a
          routerLink="/app/parking/streets"
          [queryParams]="{ city: city.id, cityId: city.contractId, cityName: city.nombre, vehicleId, plate: vehiclePlate }"
          class="btn btn-primary btn-block mt-2"
          >{{ 'parking.selectStreet' | translate }}</a
        >
      } @else if (error()) {
        <p class="card" role="alert">No se pudo cargar la información del municipio.</p>
      }
    </div>
  `,
  styles: `.back-link { display: inline-block; margin-bottom: 1rem; }`,
})
export class ParkingCityInfoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cities = inject(CitiesService);
  readonly flowStore = inject(ParkingFlowStore);
  readonly municipio = signal<ParkingMunicipio | null>(null);
  readonly error = signal(false);
  readonly vehicleId = this.route.snapshot.queryParamMap.get('vehicleId') ?? this.flowStore.vm().vehicleId ?? '';
  readonly vehiclePlate = this.route.snapshot.queryParamMap.get('plate') ?? this.flowStore.vm().plate ?? '';

  async ngOnInit(): Promise<void> {
    const requested = this.route.snapshot.queryParamMap.get('id') ?? this.route.snapshot.queryParamMap.get('city') ?? '';
    try {
      const { data } = await this.cities.getCities();
      const contractId = Number(this.route.snapshot.queryParamMap.get('cityId'));
      this.municipio.set(data.find((city) => city.id === requested || city.contractId === contractId) ?? null);
      this.error.set(!this.municipio());
    } catch {
      this.error.set(true);
    }
  }
}
