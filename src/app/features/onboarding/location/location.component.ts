import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { MOCK_MUNICIPIOS } from '../../../shared/mock-data';
import { LocationSettingsService } from '../../../core/services/location-settings.service';

@Component({
  selector: 'app-onboarding-location',
  template: `
    <div class="page">
      <h1 class="page-title">Ubicación</h1>
      <p class="page-subtitle">
        Activa la ubicación para que {{ brand.name }} sepa exactamente en qué sector estás. Te ahorramos buscar el nombre de la calle y
        evitamos errores en tu ticket.
      </p>
      <div class="card card-highlight mt-2">
        <p>📍 Permiso de ubicación</p>
        <p class="card-subtitle mt-1">Mostrarte las zonas de parkings más cercanas automáticamente</p>
      </div>
      <button type="button" class="btn btn-primary btn-block mt-2" (click)="grantPermission()">Conceder permiso</button>
      <button type="button" class="btn btn-ghost btn-block mt-1" (click)="showCityPicker.set(true)">Elegir municipio manualmente</button>
      <button type="button" class="btn btn-ghost btn-block mt-1" (click)="skip()">Ahora no</button>

      @if (message(); as msg) {
        <p class="location-feedback">{{ msg }}</p>
      }

      @if (showCityPicker()) {
        <div class="city-picker-overlay" (click)="showCityPicker.set(false)">
          <div class="city-picker" (click)="$event.stopPropagation()">
            <h3>Seleccionar municipio</h3>
            <p class="city-picker-desc">Elige tu municipio preferido para buscar zonas de estacionamiento.</p>
            <div class="city-list">
              @for (city of municipios; track city.id) {
                <button type="button" class="city-option" (click)="selectCity(city.id, city.nombre)">
                  {{ city.nombre }}
                  <small>{{ city.provincia }}</small>
                </button>
              }
            </div>
            <button type="button" class="btn btn-ghost btn-block mt-1" (click)="showCityPicker.set(false)">Cancelar</button>
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
  readonly message = signal('');

  async grantPermission(): Promise<void> {
    this.message.set('');
    const ok = await this.locationService.requestCurrentLocation();
    if (ok) {
      this.message.set('Ubicación activada. Redirigiendo...');
      setTimeout(() => void this.router.navigate(['/onboarding/notification']), 1000);
    } else {
      this.message.set('No se pudo activar la ubicación. Puedes elegir un municipio manualmente.');
    }
  }

  selectCity(id: string, name: string): void {
    this.locationService.setPreferredCity(id, name);
    this.showCityPicker.set(false);
    this.message.set('Municipio guardado. Redirigiendo...');
    setTimeout(() => void this.router.navigate(['/onboarding/notification']), 1000);
  }

  skip(): void {
    this.showCityPicker.set(false);
    this.message.set('');
    void this.router.navigate(['/app'], { replaceUrl: true });
  }
}
