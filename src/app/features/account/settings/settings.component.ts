import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { LocationSettingsService, type LocationPermissionState } from '../../../core/services/location-settings.service';
import { MOCK_MUNICIPIOS } from '../../../shared/mock-data';

interface LocationMessage {
  key: string;
  params?: Record<string, string | number>;
}

@Component({
  selector: 'app-account-settings',
  imports: [TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header [title]="'account.settings.title' | translate" backRoute="/app/account" />
      <div class="card">
        <label class="switch-row"
          ><span>{{ 'account.settings.fingerprint' | translate }}</span
          ><input type="checkbox" [checked]="fingerprint()" (change)="toggleFingerprint()" /><span class="switch"></span
        ></label>
      </div>

      <section class="card mt-2" aria-labelledby="location-settings-title">
        <p id="location-settings-title" class="location-section-title">{{ 'account.settings.location.title' | translate }}</p>
        <p class="location-section-desc">{{ 'account.settings.location.description' | translate }}</p>
        <div class="location-status">
          <span class="status-label">{{ 'account.settings.location.status' | translate }}</span>
          <span class="status-value" [class.granted]="locationService.settings().permissionState === 'granted'">
            {{ permissionLabelKey() | translate }}
          </span>
        </div>
        @if (locationService.settings().preferredCityName) {
          <div class="location-pref-city">
            <span class="status-label">{{ 'account.settings.location.preferredCity' | translate }}</span>
            <span class="status-value">{{ locationService.settings().preferredCityName }}</span>
          </div>
        }
        <div class="location-actions">
          @if (locationService.settings().permissionState !== 'granted') {
            <button type="button" class="btn btn-primary btn-sm mt-1" (click)="requestLocation()">
              {{ 'account.settings.location.enable' | translate }}
            </button>
          } @else {
            <label class="switch-row mt-1"
              ><span>{{ 'account.settings.location.useCurrent' | translate }}</span
              ><input
                type="checkbox"
                [checked]="locationService.settings().useCurrentLocation"
                (change)="locationService.toggleUseCurrentLocation($any($event.target).checked)" /><span class="switch"></span
            ></label>
          }
          <button type="button" class="btn btn-secondary btn-sm mt-1" (click)="showCityPicker.set(true)">
            {{
              (locationService.settings().preferredCityId ? 'account.settings.location.changeCity' : 'account.settings.location.chooseCity')
                | translate
            }}
          </button>
        </div>
        @if (locationMessage(); as msg) {
          <p class="location-message">{{ msg.key | translate: msg.params }}</p>
        }
      </section>

      @if (showCityPicker()) {
        <div class="modal-overlay" (click)="showCityPicker.set(false)">
          <div class="modal city-picker-modal" (click)="$event.stopPropagation()">
            <h3>{{ 'account.settings.location.cityPickerTitle' | translate }}</h3>
            <p class="modal-desc">{{ 'account.settings.location.cityPickerDesc' | translate }}</p>
            <div class="city-list">
              @for (city of municipios; track city.id) {
                <button
                  type="button"
                  class="city-option"
                  [class.selected]="locationService.settings().preferredCityId === city.id"
                  (click)="selectCity(city.id, city.nombre)"
                >
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

      <button type="button" class="btn btn-primary btn-block mt-2" (click)="saved.set(true)">
        {{ saving() ? ('account.settings.saving' | translate) : ('account.settings.save' | translate) }}
      </button>
      @if (showConfirm()) {
        <div class="modal-overlay" (click)="showConfirm.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>{{ 'account.settings.confirmIdentity' | translate }}</h3>
            <p>{{ 'account.settings.authenticate' | translate }}</p>
            <button class="btn btn-primary btn-block" (click)="showConfirm.set(false)">{{ 'common.confirm' | translate }}</button>
            <button class="btn btn-ghost btn-block" (click)="showConfirm.set(false)">{{ 'common.cancel' | translate }}</button>
          </div>
        </div>
      }
      @if (saved()) {
        <app-result-modal
          type="success"
          [title]="'account.settings.savedTitle' | translate"
          [message]="'account.settings.savedMessage' | translate"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="saved.set(false)"
        />
      }
    </div>
  `,
  styles: [
    `
      .switch-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.65rem 0;
        cursor: pointer;
      }
      .switch {
        position: relative;
        width: 44px;
        height: 24px;
        border-radius: var(--radius-pill);
        background: var(--color-border);
        transition: background 0.2s;
      }
      .switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #fff;
        transition: left 0.2s;
      }
      input:checked + .switch {
        background: var(--color-primary);
      }
      input:checked + .switch::after {
        left: 22px;
      }
      .location-section-title {
        font-weight: var(--font-bold);
        margin-bottom: 0.2rem;
      }
      .location-section-desc {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        margin-bottom: 0.6rem;
      }
      .location-status,
      .location-pref-city {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.3rem 0;
        font-size: var(--text-sm);
      }
      .status-label {
        color: var(--color-text-muted);
      }
      .status-value.granted {
        color: var(--color-primary);
        font-weight: var(--font-medium);
      }
      .location-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 0.4rem;
      }
      .location-message {
        margin-top: 0.5rem;
        font-size: var(--text-xs);
        color: var(--color-text-muted);
      }
      .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.35);
        padding: 1rem;
      }
      .modal {
        width: min(100%, 380px);
        padding: 1.5rem;
        border-radius: var(--radius-lg);
        background: var(--color-surface);
      }
      .city-picker-modal h3 {
        margin-bottom: 0.3rem;
      }
      .modal-desc {
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
      .city-option.selected {
        border-color: var(--color-primary);
        background: var(--color-active);
        font-weight: var(--font-medium);
      }
      .city-option small {
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class AccountSettingsComponent {
  readonly locationService = inject(LocationSettingsService);
  readonly municipios = MOCK_MUNICIPIOS;
  readonly fingerprint = signal(true);
  readonly saving = signal(false);
  readonly showConfirm = signal(false);
  readonly saved = signal(false);
  readonly showCityPicker = signal(false);
  readonly locationMessage = signal<LocationMessage | null>(null);

  permissionLabelKey(): string {
    const state = this.locationService.settings().permissionState;
    const map: Record<LocationPermissionState, string> = {
      unknown: 'account.settings.location.statusInactive',
      prompt: 'account.settings.location.statusPrompt',
      granted: 'account.settings.location.statusGranted',
      denied: 'account.settings.location.statusDenied',
      unsupported: 'account.settings.location.statusUnsupported',
    };
    return map[state];
  }

  toggleFingerprint(): void {
    this.fingerprint.update((v) => !v);
    this.showConfirm.set(true);
  }

  async requestLocation(): Promise<void> {
    this.locationMessage.set(null);
    const result = await this.locationService.requestCurrentLocation();
    if (result.ok) {
      this.locationMessage.set({ key: 'account.settings.location.enabledMessage' });
      return;
    }

    this.locationMessage.set({
      key: result.status === 'denied' ? 'account.settings.location.blockedMessage' : 'account.settings.location.failedMessage',
    });
  }

  selectCity(id: string, name: string): void {
    this.locationService.setPreferredCity(id, name);
    this.showCityPicker.set(false);
    this.locationMessage.set({ key: 'account.settings.location.citySavedMessage', params: { city: name } });
  }
}
