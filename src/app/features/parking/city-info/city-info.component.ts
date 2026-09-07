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
        <p class="card" role="alert">No se pudo cargar la información del municipio.</p>
      }
    </div>
  `,
  styles: `
    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
    }
    .city-hero {
      position: relative;
      overflow: hidden;
      border-radius: var(--radius-lg);
      margin-bottom: 1rem;
    }
    .city-hero img {
      display: block;
      width: 100%;
      height: 180px;
      object-fit: cover;
      filter: brightness(0.72);
    }
    .city-hero strong {
      position: absolute;
      inset: auto 1rem 1rem;
      color: #fff;
      font-size: 1.6rem;
    }
    h2 {
      margin: 0.75rem 0 0.35rem;
    }
    .contact-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.8rem 0;
      color: var(--color-text);
      text-decoration: none;
    }
    .contact-row + .contact-row {
      border-top: 1px solid var(--color-border);
    }
    .contact-row svg {
      color: var(--color-text);
      flex: 0 0 auto;
    }
  `,
})
export class ParkingCityInfoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cities = inject(CitiesService);
  readonly flowStore = inject(ParkingFlowStore);
  readonly municipio = signal<ParkingMunicipio | null>(null);
  readonly error = signal(false);
  readonly vehicleId = this.route.snapshot.queryParamMap.get('vehicleId') ?? this.flowStore.vm().vehicleId ?? '';
  readonly vehiclePlate = this.route.snapshot.queryParamMap.get('plate') ?? this.flowStore.vm().plate ?? '';

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
