import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { LocationSettingsService } from '../../../core/services/location-settings.service';
import { CitiesService } from '../../../core/services/cities.service';
import { UserService } from '../../../core/services/user.service';
import type { Municipio } from '../../../shared/models/municipio';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-onboarding-location',
  imports: [TranslatePipe],
  template: `
    <div class="page">
      <h1 class="page-title">{{ 'onboarding.location.title' | translate }}</h1>
      <p class="page-subtitle">
        {{ 'onboarding.location.subtitle' | translate: { brand: brand.name } }}
      </p>
      <div class="card card-highlight mt-2">
        <p>📍 {{ 'onboarding.location.permissionTitle' | translate }}</p>
        <p class="card-subtitle mt-1">{{ 'onboarding.location.permissionSubtitle' | translate }}</p>
      </div>
      <button type="button" class="btn btn-primary btn-block mt-2" (click)="grantPermission()">
        {{ 'onboarding.location.grant' | translate }}
      </button>
      <button type="button" class="btn btn-ghost btn-block mt-1" (click)="openCityPicker()">
        {{ 'onboarding.location.chooseCity' | translate }}
      </button>
      <button type="button" class="btn btn-ghost btn-block mt-1" (click)="skip()">
        {{ 'onboarding.location.skip' | translate }}
      </button>

      @if (message(); as msg) {
        <p class="location-feedback">{{ msg | translate }}</p>
      }

      @if (showCityPicker()) {
        <div class="city-picker-overlay" (click)="closeCityPicker()">
          <div class="city-picker" (click)="$event.stopPropagation()">
            <h3>{{ 'onboarding.location.cityPickerTitle' | translate }}</h3>
            <p class="city-picker-desc">{{ 'onboarding.location.cityPickerDesc' | translate }}</p>
            <div class="city-list">
              @for (city of municipios(); track city.id) {
                <button type="button" class="city-option" [class.selected]="selectedCity()?.id === city.id" [attr.aria-pressed]="selectedCity()?.id === city.id" [disabled]="savingCity()" (click)="selectedCity.set(city)">
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
  styles: [
    `
      .location-feedback {
        margin-top: 0.8rem;
        text-align: center;
        font-size: var(--text-sm);
        color: var(--color-primary);
      }
      .city-picker-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.35);
        padding: 1rem;
      }
      .city-picker {
        display: flex;
        flex-direction: column;
        max-height: calc(100dvh - 2rem);
        width: min(100%, 380px);
        padding: 1.5rem;
        border-radius: 20px;
        background: var(--color-surface);
      }
      .city-picker h3 {
        margin-bottom: 0.3rem;
      }
      .city-picker-desc {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        margin-bottom: 0.8rem;
      }
      .city-list {
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        max-height: 300px;
        overflow-y: auto;
      }
      .city-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 0.6rem 0.75rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
        cursor: pointer;
        text-align: left;
        font-size: var(--text-sm);
      }
      .city-option small {
        color: var(--color-text-muted);
      }
      .city-option.selected {
        border-color: var(--color-primary);
        background: var(--color-active);
      }
    `,
  ],
})
export class OnboardingLocationComponent {
  private readonly router = inject(Router);
  private readonly locationService = inject(LocationSettingsService);
  private readonly citiesService = inject(CitiesService);
  private readonly userService = inject(UserService);
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
      .catch(() => this.municipios.set([]));
  }

  async grantPermission(): Promise<void> {
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
    this.message.set('');
    try {
      const contractId = this.citiesService.contractIdFor(id);
      this.locationService.setPreferredCity(id, name, contractId);
      const result = await this.userService.updatePreferredContract(contractId);
      if (!result.success) {
        this.message.set('onboarding.location.citySaveError');
        return;
      }
      this.showCityPicker.set(false);
      this.message.set('onboarding.location.citySavedRedirect');
      setTimeout(() => void this.router.navigate(['/onboarding/notification']), 1000);
    } catch {
      this.message.set('onboarding.location.citySaveError');
    } finally {
      this.savingCity.set(false);
    }
  }

  openCityPicker(): void {
    this.selectedCity.set(this.municipios().find(city => city.id === this.locationService.settings().preferredCityId) ?? null);
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
    this.message.set('');
    void this.router.navigate(['/app'], { replaceUrl: true });
  }
}
