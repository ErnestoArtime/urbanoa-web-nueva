import { Component, inject, signal } from '@angular/core';
import { LucideLocateFixed } from '@lucide/angular';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { LocationSettingsService, type LocationPermissionState } from '../../../core/services/location-settings.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { CitiesService } from '../../../core/services/cities.service';
import { UserService } from '../../../core/services/user.service';
import type { Municipio } from '../../../shared/models/municipio';

interface LocationMessage {
  key: string;
  params?: Record<string, string | number>;
}

@Component({
  selector: 'app-account-settings',
  imports: [TranslatePipe, DetailPanelHeaderComponent, LucideLocateFixed, LoaderComponent],
  template: `
    <app-loader [visible]="savingCity()" [message]="'common.loading' | translate" />
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
          <button type="button" class="btn btn-secondary btn-sm" (click)="openCityPicker()">
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
        <div class="modal-overlay" (click)="closeCityPicker()">
          <div class="modal city-picker-modal" (click)="$event.stopPropagation()">
            <h3>{{ 'account.settings.location.cityPickerTitle' | translate }}</h3>
            <p>{{ 'account.settings.location.cityPickerDesc' | translate }}</p>
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
                  <span>{{ city.nombre }}</span
                  ><small>{{ city.provincia }}</small>
                </button>
              }
            </div>
            @if (locationMessage(); as msg) {
              <p class="inline-message" role="status">{{ msg.key | translate: msg.params }}</p>
            }
            <button type="button" class="btn btn-primary btn-block" [disabled]="!selectedCity() || savingCity()" (click)="saveCity()">
              {{ 'common.save' | translate }}
            </button>
            <button type="button" class="btn btn-ghost btn-block" [disabled]="savingCity()" (click)="closeCityPicker()">
              {{ 'common.cancel' | translate }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './settings.component.css',
})
export class AccountSettingsComponent {
  readonly locationService = inject(LocationSettingsService);
  private readonly citiesService = inject(CitiesService);
  private readonly userService = inject(UserService);
  readonly municipios = signal<Municipio[]>([]);
  readonly showCityPicker = signal(false);
  readonly savingCity = signal(false);
  readonly selectedCity = signal<Municipio | null>(null);
  readonly locationMessage = signal<LocationMessage | null>(null);

  constructor() {
    void this.citiesService
      .getCities()
      .then((result) => {
        const cities = this.citiesService.selectableCities(result.data);
        this.municipios.set(cities);
        const remoteContractId = this.userService.user().preferredContractId;
        const remoteCity = cities.find((city) => city.contractId === remoteContractId);
        if (remoteCity && !this.locationService.settings().preferredCitySyncPending) {
          this.locationService.setPreferredCity(remoteCity.id, remoteCity.nombre, remoteCity.contractId);
        }
      })
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
  openCityPicker(): void {
    this.selectedCity.set(this.municipios().find((city) => city.id === this.locationService.settings().preferredCityId) ?? null);
    this.locationMessage.set(null);
    this.showCityPicker.set(true);
  }

  closeCityPicker(): void {
    if (!this.savingCity()) this.showCityPicker.set(false);
  }

  async saveCity(): Promise<void> {
    const city = this.selectedCity();
    if (city) await this.selectCity(city.id, city.nombre);
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
  async selectCity(id: string, name: string): Promise<void> {
    if (this.savingCity()) return;
    this.savingCity.set(true);
    try {
      const contractId = this.citiesService.contractIdFor(id);
      this.locationService.setPreferredCity(id, name, contractId, true);
      const savedSettings = this.locationService.settings();
      // TODO(OPS): QueryUserAPI still returns contractId=0 after a successful update.
      // Keep the account-scoped local preference pending until OPS confirms it.
      try {
        const result = await this.userService.updatePreferredContract(contractId);
        if (result.success) this.locationService.confirmPreferredCitySync(savedSettings);
      } catch {
        // Remote failure must not block a municipality already saved locally.
      }
      this.showCityPicker.set(false);
      this.locationMessage.set({
        key: this.locationService.settings().preferredCitySyncPending
          ? 'account.settings.location.citySyncPending'
          : 'account.settings.location.citySavedMessage',
        params: { city: name },
      });
    } catch {
      this.locationMessage.set({ key: 'account.settings.location.citySaveError' });
    } finally {
      this.savingCity.set(false);
    }
  }
}
