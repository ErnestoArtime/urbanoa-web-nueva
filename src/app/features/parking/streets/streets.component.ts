import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ParkingStreet, StreetsService } from '../../../core/services/streets.service';

const CITY_API_IDS: Record<string, number> = {
  durango: 1,
  zarautz: 3,
  tolosa: 5,
  bergara: 23,
  arrasate: 61,
  soria: 73,
  deba: 79,
  mutriku: 81,
};

@Component({
  selector: 'app-parking-streets',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <a [routerLink]="['/app/parking/city-info']" [queryParams]="{ id: cityId }" class="back-link">{{
        'parking.streets.back' | translate
      }}</a>
      <h1 class="page-title">{{ 'parking.selectStreet' | translate }}</h1>
      <div class="form-group">
        <input
          class="form-input"
          type="search"
          [placeholder]="'parking.selectStreet' | translate"
          [value]="search()"
          (input)="updateSearch($event)"
        />
      </div>
      <ul class="list card" style="padding:0;overflow:hidden">
        @for (street of filteredStreets(); track street.id) {
          <a [routerLink]="['/app/parking/tickets']" [queryParams]="streetParams(street)" class="list-item">
            <span class="street-icon" aria-hidden="true"><i></i></span>
            <div class="list-item-content">
              <div class="list-item-title">{{ street.name }}</div>
              <div class="list-item-subtitle">{{ street.zoneDescription }}{{ street.tariff ? ' · ' + street.tariff : '' }}</div>
            </div>
            <span class="list-item-chevron">›</span>
          </a>
        } @empty {
          <li class="list-item empty-streets">{{ loading() ? 'Cargando calles…' : 'No se encontraron calles' }}</li>
        }
      </ul>
    </div>
  `,
  styles: [
    `
      .back-link {
        display: inline-block;
        margin-bottom: 1rem;
      }
      .street-icon {
        position: relative;
        width: 28px;
        height: 30px;
        flex: 0 0 28px;
        border-left: 3px solid currentColor;
        border-right: 3px solid currentColor;
        color: var(--color-text-muted);
      }
      .street-icon::before,
      .street-icon::after,
      .street-icon i {
        content: '';
        position: absolute;
        left: 50%;
        width: 3px;
        height: 6px;
        background: currentColor;
        transform: translateX(-50%);
      }
      .street-icon::before {
        top: 0;
      }
      .street-icon i {
        top: 12px;
      }
      .street-icon::after {
        bottom: 0;
      }
      .empty-streets {
        justify-content: center;
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class ParkingStreetsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly streetsService = inject(StreetsService);
  readonly streets = signal<ParkingStreet[]>([]);
  readonly search = signal('');
  readonly loading = signal(true);
  readonly cityId = this.route.snapshot.queryParamMap.get('city') ?? this.route.snapshot.queryParamMap.get('municipio') ?? 'zarautz';
  readonly cityName = this.route.snapshot.queryParamMap.get('cityName') ?? 'Zarautz';
  readonly plate = this.route.snapshot.queryParamMap.get('plate') ?? '1234 ABC';
  readonly filteredStreets = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('es');
    return term
      ? this.streets().filter(
          (street) => street.name.toLocaleLowerCase('es').includes(term) || street.zoneDescription.toLocaleLowerCase('es').includes(term),
        )
      : this.streets();
  });

  async ngOnInit(): Promise<void> {
    const numericId = Number(this.cityId);
    const apiCityId = Number.isFinite(numericId) ? numericId : (CITY_API_IDS[this.cityId.toLowerCase()] ?? 3);
    this.streets.set(await this.streetsService.getStreets(apiCityId));
    this.loading.set(false);
  }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  streetParams(street: ParkingStreet): Record<string, string> {
    return {
      city: this.cityId,
      cityName: this.cityName,
      cityId: this.cityId,
      plate: this.plate,
      zoneId: String(street.zoneId),
      zone: street.zoneDescription,
      street: street.name,
      streetId: String(street.id),
      sector: street.zoneDescription,
      sectorColor: '3f51b5',
      sectorId: '1',
      ticketId: '1',
      latitude: '0',
      longitude: '0',
    };
  }
}
