import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LocationSettingsService } from '../../../core/services/location-settings.service';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { MOCK_MUNICIPIOS } from '../../../shared/mock-data';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface LocationFeedback {
  key: string;
  params?: Record<string, string | number>;
}

@Component({
  selector: 'app-onboarding-location',
  imports: [TranslatePipe],
  template: `
    <div class="page">
      <h1 class="page-title">{{ 'onboarding.location.title' | translate }}</h1>
      <p class="page-subtitle">{{ 'onboarding.location.subtitle' | translate: { brand: brand.name } }}</p>
      <div class="card card-highlight mt-2">
        <p>{{ 'onboarding.location.permissionTitle' | translate }}</p>
        <p class="card-subtitle mt-1">{{ 'onboarding.location.permissionSubtitle' | translate }}</p>
      </div>
      <button type="button" class="btn btn-primary btn-block mt-2" (click)="grantPermission()">
        {{ 'onboarding.location.grant' | translate }}
      </button>
      <button type="button" class="btn btn-ghost btn-block mt-1" (click)="showCityPicker.set(true)">
        {{ 'onboarding.location.chooseCity' | translate }}
      </button>
      <button type="button" class="btn btn-ghost btn-block mt-1" (click)="skip()">
        {{ 'onboarding.location.skip' | translate }}
      </button>

      @if (message(); as msg) {
        <p class="location-feedback">{{ msg.key | translate: msg.params }}</p>
      }

      @if (showCityPicker()) {
        <div class="city-picker-overlay" (click)="showCityPicker.set(false)">
          <div class="city-picker" (click)="$event.stopPropagation()">
            <h3>{{ 'onboarding.location.cityPickerTitle' | translate }}</h3>
            <p class="city-picker-desc">{{ 'onboarding.location.cityPickerDesc' | translate }}</p>
            <div class="city-list">
              @for (city of municipios; track city.id) {
                <button type="button" class="city-option" (click)="selectCity(city.id, city.nombre)">
                  {{ city.nombre }}
                  <small>{{ city.provincia }}</small>
                </button>
              }
            </div>
            <button type="button" class="btn btn-ghost btn-block mt-1" (click)="showCityPicker.set(false)">
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
        width: min(100%, 380px);
        padding: 1.5rem;
        border-radius: var(--radius-lg);
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
    `,
  ],
})
export class OnboardingLocationComponent {
  private readonly router = inject(Router);
  private readonly locationService = inject(LocationSettingsService);
  readonly brand = APP_BRAND;
  readonly municipios = MOCK_MUNICIPIOS;
  readonly showCityPicker = signal(false);
  readonly message = signal<LocationFeedback | null>(null);

  async grantPermission(): Promise<void> {
    this.message.set(null);
    const result = await this.locationService.requestCurrentLocation();
    if (result.ok) {
      this.message.set({ key: 'onboarding.location.enabledRedirect' });
      setTimeout(() => void this.router.navigate(['/onboarding/notification']), 1000);
      return;
    }

    this.message.set({
      key: result.status === 'denied' ? 'onboarding.location.denied' : 'onboarding.location.failed',
    });
  }

  selectCity(id: string, name: string): void {
    this.locationService.setPreferredCity(id, name);
    this.showCityPicker.set(false);
    this.message.set({ key: 'onboarding.location.citySavedRedirect' });
    setTimeout(() => void this.router.navigate(['/onboarding/notification']), 1000);
  }

  skip(): void {
    this.showCityPicker.set(false);
    this.message.set(null);
    void this.router.navigate(['/app']);
  }
}
