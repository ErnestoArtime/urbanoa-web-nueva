import { Component, inject, signal } from '@angular/core';
import { LucideCheck, LucideFingerprint, LucideLocateFixed, LucideScanFace, LucideShield, LucideTrash2 } from '@lucide/angular';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { LocationSettingsService, type LocationPermissionState } from '../../../core/services/location-settings.service';
import { SecuritySettingsService, type BiometricMode } from '../../../core/services/security-settings.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { MOCK_MUNICIPIOS } from '../../../shared/mock-data';

interface LocationMessage {
  key: string;
  params?: Record<string, string | number>;
}

@Component({
  selector: 'app-account-settings',
  imports: [
    TranslatePipe,
    DetailPanelHeaderComponent,
    LucideCheck,
    LucideFingerprint,
    LucideLocateFixed,
    LucideScanFace,
    LucideShield,
    LucideTrash2,
  ],
  template: `
    <div class="page account-static-page settings-page">
      <app-detail-panel-header [title]="'account.settings.title' | translate" backRoute="/app/account" />

      <section class="settings-intro">
        <div class="intro-icon"><svg lucideShield size="25"></svg></div>
        <div>
          <h2>{{ 'account.settings.security.title' | translate }}</h2>
          <p>{{ 'account.settings.security.description' | translate }}</p>
        </div>
      </section>

      <section class="card settings-card" aria-labelledby="biometric-title">
        <div class="section-heading">
          <div>
            <span class="eyebrow">{{ 'account.settings.security.access' | translate }}</span>
            <h3 id="biometric-title">{{ 'account.settings.security.biometricTitle' | translate }}</h3>
          </div>
          <span class="security-state" [class.active]="security.settings().unlockEnabled">{{
            (security.settings().unlockEnabled ? 'account.settings.security.active' : 'account.settings.security.inactive') | translate
          }}</span>
        </div>
        <p class="section-copy">{{ 'account.settings.security.biometricDescription' | translate }}</p>
        <div class="biometric-options">
          <button
            type="button"
            class="biometric-option"
            [class.selected]="security.settings().biometricMode === 'fingerprint'"
            (click)="requestBiometric('fingerprint')"
          >
            <span class="option-icon"><svg lucideFingerprint size="25"></svg></span
            ><span
              ><strong>{{ 'account.settings.security.fingerprint' | translate }}</strong
              ><small>{{ 'account.settings.security.fingerprintHint' | translate }}</small></span
            >
            @if (security.settings().biometricMode === 'fingerprint') {
              <svg lucideCheck class="option-check" size="20"></svg>
            }
          </button>
          <button
            type="button"
            class="biometric-option"
            [class.selected]="security.settings().biometricMode === 'face'"
            (click)="requestBiometric('face')"
          >
            <span class="option-icon"><svg lucideScanFace size="25"></svg></span
            ><span
              ><strong>{{ 'account.settings.security.face' | translate }}</strong
              ><small>{{ 'account.settings.security.faceHint' | translate }}</small></span
            >
            @if (security.settings().biometricMode === 'face') {
              <svg lucideCheck class="option-check" size="20"></svg>
            }
          </button>
        </div>
        @if (security.settings().unlockEnabled) {
          <button type="button" class="text-action" (click)="requestBiometric('none')">
            {{ 'account.settings.security.disable' | translate }}
          </button>
        }
      </section>

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

      <section class="danger-zone">
        <div>
          <h3>{{ 'account.settings.data.title' | translate }}</h3>
          <p>{{ 'account.settings.data.description' | translate }}</p>
        </div>
        <button type="button" class="danger-button" (click)="showClearConfirm.set(true)">
          <svg lucideTrash2 size="18"></svg>{{ 'account.settings.data.clear' | translate }}
        </button>
      </section>

      @if (pendingBiometric() !== null) {
        <div class="modal-overlay" (click)="pendingBiometric.set(null)">
          <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
            <div class="modal-symbol"><svg lucideShield size="28"></svg></div>
            <h3>{{ 'account.settings.confirmIdentity' | translate }}</h3>
            <p>{{ 'account.settings.authenticate' | translate }}</p>
            <button class="btn btn-primary btn-block" (click)="confirmBiometric()">{{ 'common.confirm' | translate }}</button
            ><button class="btn btn-ghost btn-block" (click)="pendingBiometric.set(null)">{{ 'common.cancel' | translate }}</button>
          </div>
        </div>
      }

      @if (showClearConfirm()) {
        <div class="modal-overlay" (click)="showClearConfirm.set(false)">
          <div class="modal" role="alertdialog" aria-modal="true" (click)="$event.stopPropagation()">
            <div class="modal-symbol danger"><svg lucideTrash2 size="27"></svg></div>
            <h3>{{ 'account.settings.data.confirmTitle' | translate }}</h3>
            <p>{{ 'account.settings.data.confirmMessage' | translate }}</p>
            <button class="btn danger-confirm btn-block" (click)="clearData()">{{ 'account.settings.data.confirm' | translate }}</button
            ><button class="btn btn-ghost btn-block" (click)="showClearConfirm.set(false)">{{ 'common.cancel' | translate }}</button>
          </div>
        </div>
      }

      @if (showCityPicker()) {
        <div class="modal-overlay" (click)="showCityPicker.set(false)">
          <div class="modal city-picker-modal" (click)="$event.stopPropagation()">
            <h3>{{ 'account.settings.location.cityPickerTitle' | translate }}</h3>
            <p>{{ 'account.settings.location.cityPickerDesc' | translate }}</p>
            <div class="city-list">
              @for (city of municipios; track city.id) {
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
      .settings-intro {
        display: flex;
        gap: 0.85rem;
        align-items: center;
        padding: 0.25rem 0.1rem;
      }
      .intro-icon,
      .modal-symbol {
        display: grid;
        flex: 0 0 auto;
        place-items: center;
        width: 48px;
        height: 48px;
        border-radius: 16px;
        color: var(--color-primary);
        background: var(--color-active);
      }
      .settings-intro h2,
      .section-heading h3,
      .danger-zone h3,
      .modal h3 {
        margin: 0;
        font-size: var(--text-base);
      }
      .settings-intro p,
      .section-copy,
      .danger-zone p,
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
      .eyebrow {
        color: var(--color-primary);
        font-size: var(--text-2xs);
        font-weight: var(--font-bold);
        letter-spacing: 0.1em;
        text-transform: uppercase;
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
      .biometric-options {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.55rem;
      }
      .biometric-option {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.75rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
        color: var(--color-text);
        text-align: left;
        cursor: pointer;
      }
      .biometric-option.selected {
        border-color: var(--color-primary);
        background: var(--color-active);
      }
      .option-icon {
        display: grid;
        flex: 0 0 auto;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 13px;
        color: var(--color-primary);
        background: var(--color-background);
      }
      .biometric-option strong,
      .biometric-option small {
        display: block;
      }
      .biometric-option small {
        margin-top: 0.15rem;
        color: var(--color-text-muted);
        font-size: var(--text-2xs);
      }
      .option-check {
        position: absolute;
        top: 0.45rem;
        right: 0.45rem;
        color: var(--color-primary);
      }
      .text-action {
        margin-top: 0.7rem;
        border: 0;
        background: transparent;
        color: var(--color-primary);
        font-size: var(--text-xs);
        font-weight: var(--font-bold);
        cursor: pointer;
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
      .danger-zone {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.85rem 1rem;
        border: 1px solid color-mix(in srgb, var(--color-error) 28%, transparent);
        border-radius: var(--radius-lg);
      }
      .danger-button,
      .danger-confirm {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        border: 0;
        color: #fff;
        background: var(--color-error);
        cursor: pointer;
      }
      .danger-button {
        flex: 0 0 auto;
        padding: 0.55rem 0.75rem;
        border-radius: var(--radius-pill);
        font-size: var(--text-xs);
        font-weight: var(--font-bold);
      }
      .danger-confirm {
        min-height: 42px;
        border-radius: var(--radius-pill);
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
      .modal-symbol {
        margin-bottom: 0.8rem;
      }
      .modal-symbol.danger {
        color: var(--color-error);
        background: color-mix(in srgb, var(--color-error) 10%, white);
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
      @media (max-width: 560px) {
        .biometric-options {
          grid-template-columns: 1fr;
        }
        .danger-zone {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class AccountSettingsComponent {
  readonly locationService = inject(LocationSettingsService);
  readonly security = inject(SecuritySettingsService);
  readonly municipios = MOCK_MUNICIPIOS;
  readonly pendingBiometric = signal<BiometricMode | null>(null);
  readonly showClearConfirm = signal(false);
  readonly showCityPicker = signal(false);
  readonly locationMessage = signal<LocationMessage | null>(null);

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
  requestBiometric(mode: BiometricMode): void {
    this.pendingBiometric.set(mode);
  }
  confirmBiometric(): void {
    const mode = this.pendingBiometric();
    if (mode !== null) this.security.setBiometric(mode);
    this.pendingBiometric.set(null);
  }
  clearData(): void {
    this.security.clearLocalUserData();
    this.showClearConfirm.set(false);
    location.reload();
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
    this.showCityPicker.set(false);
    this.locationMessage.set({ key: 'account.settings.location.citySavedMessage', params: { city: name } });
  }
}
