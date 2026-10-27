import { ApiErrorPipe } from '../../../shared/pipes/api-error.pipe';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { LocationSettingsService } from '../../../core/services/location-settings.service';
import { CitiesService } from '../../../core/services/cities.service';
import { UserService } from '../../../core/services/user.service';
import type { Municipio } from '../../../shared/models/municipio';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-onboarding-location',
  imports: [ApiErrorPipe, TranslatePipe, AppIconComponent],
  template: `
    <div class="location-page">
      <header class="location-header">
        <img [src]="brand.logoPath" [alt]="brand.name" class="location-logo" />
      </header>
      <main class="location-content">
        <section class="card location-panel" aria-labelledby="location-title">
          <h1 id="location-title" class="location-title">{{ 'onboarding.location.title' | translate }}</h1>
          <p class="location-subtitle">
            {{ 'onboarding.location.subtitle' | translate: { brand: brand.name } }}
          </p>
          <div class="location-permission">
            <span class="location-icon"><app-icon name="location" [size]="28" [stroke]="false" /></span>
            <div>
              <h2 class="permission-title">{{ 'onboarding.location.permissionTitle' | translate }}</h2>
              <p class="card-subtitle mt-1">{{ 'onboarding.location.permissionSubtitle' | translate }}</p>
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-block mt-2" (click)="grantPermission()">
            {{ 'onboarding.location.grant' | translate }}
          </button>
          <button type="button" class="btn btn-secondary btn-block mt-1" (click)="openCityPicker()">
            {{ 'onboarding.location.chooseCity' | translate }}
          </button>
          <button type="button" class="btn btn-ghost btn-block mt-1" (click)="skip()">
            {{ 'onboarding.location.skip' | translate }}
          </button>

          @if (message(); as msg) {
            <p class="location-feedback">
              {{
                requestError()
                  ? (requestError() | apiError: msg)
                  : msg === 'onboarding.location.citySyncPending'
                    ? (userService.lastError() | apiError: msg)
                    : (msg | translate)
              }}
            </p>
          }
        </section>
      </main>
      @if (showCityPicker()) {
        <div class="city-picker-overlay" (click)="closeCityPicker()">
          <div class="city-picker" (click)="$event.stopPropagation()">
            <h3>{{ 'onboarding.location.cityPickerTitle' | translate }}</h3>
            <p class="city-picker-desc">{{ 'onboarding.location.cityPickerDesc' | translate }}</p>
            <div class="city-list">
              @for (city of municipios(); track city.id) {
                <button
                  type="button"
                  class="city-option"
                  [class.selected]="selectedCity()?.id === city.id"
                  [attr.aria-pressed]="selectedCity()?.id === city.id"
                  [disabled]="savingCity()"
                  (click)="selectedCity.set(city)"
                >
                  {{ city.nombre }}
                  <small>{{ city.provincia }}</small>
                </button>
              }
            </div>
            @if (message()) {
              <p class="location-feedback" role="status">{{ message() | translate }}</p>
            }
            <button type="button" class="btn btn-primary btn-block mt-1" [disabled]="!selectedCity() || savingCity()" (click)="saveCity()">
              {{ 'common.save' | translate }}
            </button>
            <button type="button" class="btn btn-ghost btn-block mt-1" [disabled]="savingCity()" (click)="closeCityPicker()">
              {{ 'common.cancel' | translate }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './location.component.css',
})
export class OnboardingLocationComponent {
  readonly requestError = signal<unknown>(null);
  private readonly router = inject(Router);
  private readonly locationService = inject(LocationSettingsService);
  private readonly citiesService = inject(CitiesService);
  readonly userService = inject(UserService);
  readonly brand = APP_BRAND;
  readonly municipios = signal<Municipio[]>([]);
  readonly showCityPicker = signal(false);
  readonly selectedCity = signal<Municipio | null>(null);
  readonly savingCity = signal(false);
  readonly message = signal('');

  constructor() {
    void this.citiesService
      .getCities()
      .then((result) => this.municipios.set(this.citiesService.selectableCities(result.data)))
      .catch((error) => {
        this.requestError.set(error);
        this.municipios.set([]);
        this.message.set('parking.cities.loadError');
      });
  }

  async grantPermission(): Promise<void> {
    this.requestError.set(null);
    this.message.set('');
    const ok = await this.locationService.requestCurrentLocation();
    if (ok.ok) {
      this.message.set('onboarding.location.enabledRedirect');
      setTimeout(() => void this.router.navigate(['/onboarding/notification']), 1000);
    } else {
      this.message.set('onboarding.location.failed');
    }
  }

  async selectCity(id: string, name: string): Promise<void> {
    if (this.savingCity()) return;
    this.savingCity.set(true);
    this.requestError.set(null);
    this.message.set('');
    try {
      const contractId = this.citiesService.contractIdFor(id);
      this.locationService.setPreferredCity(id, name, contractId, true);
      const savedSettings = this.locationService.settings();
      // TODO(OPS): Leave synchronization pending while OPS does not retain contractId.
      try {
        const result = await this.userService.updatePreferredContract(contractId);
        if (result.success) this.locationService.confirmPreferredCitySync(savedSettings);
      } catch (error) {
        this.requestError.set(error);
        // The local choice remains usable even when OPS cannot synchronize it.
      }
      this.showCityPicker.set(false);
      this.message.set(
        this.locationService.settings().preferredCitySyncPending
          ? 'onboarding.location.citySyncPending'
          : 'onboarding.location.citySavedRedirect',
      );
      setTimeout(() => void this.router.navigate(['/onboarding/notification']), 1000);
    } catch (error) {
      this.requestError.set(error);
      this.message.set('onboarding.location.citySaveError');
    } finally {
      this.savingCity.set(false);
    }
  }

  openCityPicker(): void {
    this.selectedCity.set(this.municipios().find((city) => city.id === this.locationService.settings().preferredCityId) ?? null);
    this.requestError.set(null);
    this.message.set('');
    this.showCityPicker.set(true);
  }

  closeCityPicker(): void {
    if (!this.savingCity()) this.showCityPicker.set(false);
  }

  async saveCity(): Promise<void> {
    const city = this.selectedCity();
    if (city) await this.selectCity(city.id, city.nombre);
  }

  skip(): void {
    this.showCityPicker.set(false);
    this.requestError.set(null);
    this.message.set('');
    void this.router.navigate(['/app'], { replaceUrl: true });
  }
}
