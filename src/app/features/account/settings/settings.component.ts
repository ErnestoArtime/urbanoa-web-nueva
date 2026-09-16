import { Component, inject, signal } from '@angular/core';
import { LucideLocateFixed } from '@lucide/angular';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { LocationSettingsService, type LocationPermissionState } from '../../../core/services/location-settings.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { CitiesService } from '../../../core/services/cities.service';
import { UserService } from '../../../core/services/user.service';
import type { Municipio } from '../../../shared/models/municipio';

interface LocationMessage {
  key: string;
  params?: Record<string, string | number>;
}

@Component({
  selector: 'app-account-settings',
  imports: [TranslatePipe, DetailPanelHeaderComponent, LucideLocateFixed],
  template: `
    <div class="page account-static-page settings-page">
      <app-detail-panel-header [title]="'account.settings.title' | translate" backRoute="/app/account" />

      <section class="card settings-card" aria-labelledby="location-settings-title">
        <div class="section-heading">
          <div class="heading-with-icon">
            <svg lucideLocateFixed size="21"></svg>
            <h3 id="location-settings-title">{{ 'account.settings.location.title' | translate }}</h3>
          </div>
          <span class="security-state" [class.active]="locationService.settings().permissionState === 'granted'">{{
            permissionLabelKey() | translate
          }}</span>
        </div>
        <p class="section-copy">{{ 'account.settings.location.description' | translate }}</p>
        @if (locationService.settings().preferredCityName) {
          <div class="preference-row">
            <span>{{ 'account.settings.location.preferredCity' | translate }}</span
            ><strong>{{ locationService.settings().preferredCityName }}</strong>
          </div>
        }
        <div class="location-actions">
          @if (locationService.settings().permissionState !== 'granted') {
            <button type="button" class="btn btn-primary btn-sm" (click)="requestLocation()">
              {{ 'account.settings.location.enable' | translate }}
            </button>
          } @else {
            <label class="switch-row"
              ><span>{{ 'account.settings.location.useCurrent' | translate }}</span
              ><input
                type="checkbox"
                [checked]="locationService.settings().useCurrentLocation"
                (change)="locationService.toggleUseCurrentLocation($any($event.target).checked)" /><span class="switch"></span
            ></label>
          }
          <button type="button" class="btn btn-secondary btn-sm" (click)="showCityPicker.set(true)">
            {{
              (locationService.settings().preferredCityId ? 'account.settings.location.changeCity' : 'account.settings.location.chooseCity')
                | translate
            }}
          </button>
        </div>
        @if (locationMessage(); as msg) {
          <p class="inline-message">{{ msg.key | translate: msg.params }}</p>
        }
      </section>

      @if (showCityPicker()) {
        <div class="modal-overlay" (click)="showCityPicker.set(false)">
          <div class="modal city-picker-modal" (click)="$event.stopPropagation()">
            <h3>{{ 'account.settings.location.cityPickerTitle' | translate }}</h3>
            <p>{{ 'account.settings.location.cityPickerDesc' | translate }}</p>
            <div class="city-list">
              @for (city of municipios(); track city.id) {
                <button
                  type="button"
                  class="city-option"
                  [class.selected]="locationService.settings().preferredCityId === city.id"
                  (click)="selectCity(city.id, city.nombre)"
                >
                  <span>{{ city.nombre }}</span
                  ><small>{{ city.provincia }}</small>
                </button>
              }
            </div>
            <button type="button" class="btn btn-ghost btn-block" (click)="showCityPicker.set(false)">
              {{ 'common.cancel' | translate }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .settings-page {
        display: grid;
        gap: 0.9rem;
      }
      .section-heading h3,
      .modal h3 {
        margin: 0;
        font-size: var(--text-base);
      }
      .section-copy,
      .modal p {
        margin: 0.2rem 0 0;
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        line-height: 1.5;
      }
      .settings-card {
        padding: 1rem;
      }
      .section-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .heading-with-icon {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--color-primary);
      }
      .heading-with-icon h3 {
        color: var(--color-text);
      }
      .security-state {
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-pill);
        color: var(--color-text-muted);
        background: var(--color-background);
        font-size: var(--text-2xs);
        font-weight: var(--font-bold);
      }
      .security-state.active {
        color: var(--color-primary);
        background: var(--color-active);
      }
      .section-copy {
        margin-bottom: 0.8rem;
      }
      .preference-row {
        display: flex;
        justify-content: space-between;
        padding: 0.55rem 0;
        border-top: 1px solid var(--color-border);
        font-size: var(--text-xs);
      }
      .preference-row span {
        color: var(--color-text-muted);
      }
      .location-actions {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        flex-wrap: wrap;
      }
      .switch-row {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        cursor: pointer;
        font-size: var(--text-xs);
      }
      .switch-row input {
        position: absolute;
        opacity: 0;
      }
      .switch {
        position: relative;
        width: 42px;
        height: 23px;
        border-radius: var(--radius-pill);
        background: var(--color-border);
        transition: 0.2s;
      }
      .switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 19px;
        height: 19px;
        border-radius: 50%;
        background: white;
        transition: 0.2s;
      }
      input:checked + .switch {
        background: var(--color-primary);
      }
      input:checked + .switch::after {
        left: 21px;
      }
      .inline-message {
        margin-top: 0.6rem;
        color: var(--color-primary);
        font-size: var(--text-xs);
      }
      .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: grid;
        place-items: center;
        padding: 1rem;
        background: rgba(12, 25, 22, 0.46);
        backdrop-filter: blur(3px);
      }
      .modal {
        width: min(100%, 390px);
        padding: 1.4rem;
        border-radius: var(--radius-lg);
        background: var(--color-surface);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      }
      .modal p {
        margin-bottom: 1rem;
      }
      .city-list {
        display: grid;
        gap: 0.35rem;
        max-height: 300px;
        margin: 0.8rem 0;
        overflow: auto;
      }
      .city-option {
        display: flex;
        justify-content: space-between;
        padding: 0.65rem 0.75rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
        cursor: pointer;
      }
      .city-option.selected {
        border-color: var(--color-primary);
        background: var(--color-active);
      }
      .city-option small {
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class AccountSettingsComponent {
  readonly locationService = inject(LocationSettingsService);
  private readonly citiesService = inject(CitiesService);
  private readonly userService = inject(UserService);
  readonly municipios = signal<Municipio[]>([]);
  readonly showCityPicker = signal(false);
  readonly locationMessage = signal<LocationMessage | null>(null);

  constructor() {
    void this.citiesService
      .getCities()
      .then((result) => this.municipios.set(this.citiesService.selectableCities(result.data)))
      .catch(() => this.municipios.set([]));
  }

  permissionLabelKey(): string {
    const map: Record<LocationPermissionState, string> = {
      unknown: 'account.settings.location.statusInactive',
      prompt: 'account.settings.location.statusPrompt',
      granted: 'account.settings.location.statusGranted',
      denied: 'account.settings.location.statusDenied',
      unsupported: 'account.settings.location.statusUnsupported',
    };
    return map[this.locationService.settings().permissionState];
  }
  async requestLocation(): Promise<void> {
    this.locationMessage.set(null);
    const result = await this.locationService.requestCurrentLocation();
    this.locationMessage.set({
      key: result.ok
        ? 'account.settings.location.enabledMessage'
        : result.status === 'denied'
          ? 'account.settings.location.blockedMessage'
          : 'account.settings.location.failedMessage',
    });
  }
  selectCity(id: string, name: string): void {
    this.locationService.setPreferredCity(id, name);
    void this.userService.updatePreferredContract(this.citiesService.contractIdFor(id));
    this.showCityPicker.set(false);
    this.locationMessage.set({ key: 'account.settings.location.citySavedMessage', params: { city: name } });
  }
}
