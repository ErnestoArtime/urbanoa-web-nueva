import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CitiesService, type ParkingMunicipio } from '../../../core/services/cities.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ParkingFlowStore } from '../parking-flow.store';
import { LucideMail, LucideMapPin, LucidePhone } from '@lucide/angular';

@Component({
  selector: 'app-parking-city-info',
  imports: [RouterLink, TranslatePipe, LucideMail, LucideMapPin, LucidePhone],
  template: `
    <div class="page">
      <a routerLink="/app/parking/cities" class="back-link">{{ 'parking.cityInfo.back' | translate }}</a>
      @if (municipio(); as city) {
        @if (city.imagePath || city.imagen) {
          <div class="city-hero">
            <img [src]="city.imagePath || 'assets/municipios/' + city.imagen" [alt]="city.nombre" /><strong>{{ city.nombre }}</strong>
          </div>
        }
        <h2>{{ 'parking.cityInfo.contact' | translate }}</h2>
        <div class="card mt-2">
          @if (city.address) {
            <a class="contact-row" [href]="mapsUrl(city.address)" target="_blank" rel="noopener">
              <svg lucideMapPin [size]="24" [strokeWidth]="1.8"></svg><span>{{ city.address }}</span>
            </a>
          }
          @if (city.phone) {
            <a class="contact-row" [href]="'tel:' + city.phone"
              ><svg lucidePhone [size]="24" [strokeWidth]="1.8"></svg><span>{{ city.phone }}</span></a
            >
          }
          @if (city.email) {
            <a class="contact-row" [href]="'mailto:' + city.email"
              ><svg lucideMail [size]="24" [strokeWidth]="1.8"></svg><span>{{ city.email }}</span></a
            >
          }
        </div>
        <a
          routerLink="/app/parking/streets"
          [queryParams]="{ city: city.id, cityId: city.contractId, cityName: city.nombre, vehicleId, plate: vehiclePlate }"
          class="btn btn-primary btn-block mt-2"
          >{{ 'parking.selectStreet' | translate }}</a
        >
      } @else if (error()) {
        <p class="card" role="alert">{{ 'parking.cityInfo.loadError' | translate }}</p>
      }
    </div>
  `,
  styleUrl: './city-info.component.css',
})
export class ParkingCityInfoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cities = inject(CitiesService);
  readonly flowStore = inject(ParkingFlowStore);
  readonly municipio = signal<ParkingMunicipio | null>(null);
  readonly error = signal(false);
  get vehicleId(): string {
    return this.flowStore.vm().vehicleId ?? this.route.snapshot.queryParamMap.get('vehicleId') ?? '';
  }
  get vehiclePlate(): string {
    return this.flowStore.vm().plate ?? this.route.snapshot.queryParamMap.get('plate') ?? '';
  }

  mapsUrl(address: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

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
