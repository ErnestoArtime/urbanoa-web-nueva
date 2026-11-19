import { ApiErrorPipe } from '../../../shared/pipes/api-error.pipe';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { UserService, type UserAddress } from '../../../core/services/user.service';
import { FRENCH_PROVINCES, MUNICIPALITIES_BY_PROVINCE_ID, SPANISH_PROVINCES, type RegionOption } from './address-regions';

const SPAIN_NAMES = new Set(['', 'es', 'esp', 'espana', 'spain', 'espainia']);
const FRANCE_NAMES = new Set(['fr', 'fra', 'francia', 'france', 'frantzia']);

function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

function findByName<T>(items: readonly T[], value: string, nameOf: (item: T) => string): T | undefined {
  const wanted = normalizeName(value);
  if (!wanted) return undefined;
  return items.find((item) => {
    const name = nameOf(item);
    return normalizeName(name) === wanted || normalizeName(name).split('/').includes(wanted);
  });
}

@Component({
  selector: 'app-account-tax-data',
  imports: [ApiErrorPipe, TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent, LoaderComponent],
  template: `
    <app-loader [visible]="saving()" [message]="'common.loading' | translate" />
    <div class="page account-static-page account-form-page">
      <app-detail-panel-header [title]="'account.taxData.title' | translate" backRoute="/app/account" />
      <div class="account-editor-body">
        <div class="card">
          <div class="form-group">
            <label for="tax-data-field-1">{{ 'account.taxData.nif' | translate }}</label
            ><input
              id="tax-data-field-1"
              class="form-input"
              [value]="nif()"
              [attr.aria-invalid]="!validNif()"
              (input)="setNif($any($event.target).value)"
              [placeholder]="'account.taxData.nif' | translate"
            />
          </div>
          @if (!validNif()) {
            <p class="form-error" role="alert">{{ 'account.taxData.nifInvalid' | translate }}</p>
          }
          <div class="form-group">
            <label for="tax-data-field-2">{{ 'account.taxData.street' | translate }}</label
            ><input
              id="tax-data-field-2"
              class="form-input"
              [value]="address().street"
              (input)="setAddress('street', $any($event.target).value)"
              [placeholder]="'account.taxData.street' | translate"
            />
          </div>
          <div class="form-group">
            <label for="tax-data-field-3">{{ 'account.taxData.number' | translate }}</label
            ><input
              id="tax-data-field-3"
              class="form-input"
              [value]="address().number"
              (input)="setAddress('number', $any($event.target).value)"
              [placeholder]="'account.taxData.number' | translate"
            />
          </div>
          <div class="row">
            <div class="form-group">
              <label for="tax-data-field-4">{{ 'account.taxData.floor' | translate }}</label
              ><input
                id="tax-data-field-4"
                class="form-input"
                [value]="address().floor"
                (input)="setAddress('floor', $any($event.target).value)"
                [placeholder]="'account.taxData.floor' | translate"
              />
            </div>
            <div class="form-group">
              <label for="tax-data-field-5">{{ 'account.taxData.door' | translate }}</label
              ><input
                id="tax-data-field-5"
                class="form-input"
                [value]="address().door"
                (input)="setAddress('door', $any($event.target).value)"
                [placeholder]="'account.taxData.door' | translate"
              />
            </div>
          </div>
          <div class="row">
            <div class="form-group">
              <label for="tax-data-field-6">{{ 'account.taxData.stair' | translate }}</label
              ><input
                id="tax-data-field-6"
                class="form-input"
                [value]="address().stair"
                (input)="setAddress('stair', $any($event.target).value)"
                [placeholder]="'account.taxData.stair' | translate"
              />
            </div>
            <div class="form-group">
              <label for="tax-data-field-7">{{ 'account.taxData.letter' | translate }}</label
              ><input
                id="tax-data-field-7"
                class="form-input"
                [value]="address().letter"
                (input)="setAddress('letter', $any($event.target).value)"
                [placeholder]="'account.taxData.letter' | translate"
              />
            </div>
          </div>
          <div class="form-group">
            <label for="tax-data-country">{{ 'account.taxData.country' | translate }}</label>
            <input id="tax-data-country" class="form-input" [value]="address().country" (input)="setCountry($any($event.target).value)" />
          </div>
          <div class="form-group">
            <label for="tax-data-field-9">{{ 'account.taxData.province' | translate }}</label
            ><input
              id="tax-data-field-9"
              class="form-input"
              [value]="address().province"
              [attr.list]="provinceOptions().length ? 'tax-data-provinces' : null"
              autocomplete="off"
              (input)="setProvince($any($event.target).value)"
              (change)="commitProvince($any($event.target))"
              [placeholder]="'account.taxData.province' | translate"
            />
            @if (provinceOptions().length) {
              <datalist id="tax-data-provinces">
                @for (option of provinceOptions(); track option.id) {
                  <option [value]="option.name"></option>
                }
              </datalist>
            }
          </div>
          <div class="form-group">
            <label for="tax-data-field-8">{{ 'account.taxData.city' | translate }}</label
            ><input
              id="tax-data-field-8"
              class="form-input"
              [value]="address().city"
              [attr.list]="municipalityOptions().length ? 'tax-data-municipalities' : null"
              autocomplete="off"
              (input)="setAddress('city', $any($event.target).value)"
              (change)="commitCity($any($event.target))"
              [placeholder]="'account.taxData.city' | translate"
            />
            @if (municipalityOptions().length) {
              <datalist id="tax-data-municipalities">
                @for (name of municipalityOptions(); track name) {
                  <option [value]="name"></option>
                }
              </datalist>
            }
          </div>
          <div class="form-group">
            <label for="tax-data-field-10">{{ 'account.taxData.postalCode' | translate }}</label
            ><input
              id="tax-data-field-10"
              class="form-input"
              [value]="address().postalCode"
              (input)="setAddress('postalCode', $any($event.target).value)"
              [placeholder]="'account.taxData.postalCode' | translate"
            />
          </div>
        </div>
      </div>
      <div class="account-editor-actions">
        <button type="button" class="btn btn-primary btn-block" [disabled]="saving() || !canSave()" (click)="save()">
          {{ saving() ? ('common.saving' | translate) : ('common.save' | translate) }}
        </button>
      </div>
      @if (saved()) {
        <app-result-modal
          type="success"
          [title]="'account.taxData.saveSuccess' | translate"
          [message]="'account.taxData.saveSuccessDetail' | translate"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="saved.set(false)"
        />
      }
      @if (saveFailed()) {
        <app-result-modal
          type="error"
          [title]="'account.taxData.saveError' | translate"
          [message]="errorForDisplay() | apiError: 'account.taxData.saveErrorDetail'"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="saveFailed.set(false)"
        />
      }
    </div>
  `,
  styleUrls: ['../account-editor.css', './tax-data.component.css'],
})
export class AccountTaxDataComponent {
  readonly requestError = signal<unknown>(null);
  errorForDisplay(): unknown {
    return this.requestError() ?? this.userService.lastError?.();
  }

  private readonly userService = inject(UserService);

  readonly nif = signal('');
  readonly address = signal<UserAddress>({ ...this.userService.user().address });
  readonly submitted = signal(false);
  readonly saved = signal(false);
  readonly saving = signal(false);
  readonly saveFailed = signal(false);
  private edited = false;
  // APK TaxDataViewModel: any content, with an optional NIF matching Validator.REGEX_NIF.
  readonly validNif = computed(() => !this.nif().trim() || /^(?:[0-9]{8}[A-Za-z]|[A-Za-z][0-9]{7}[0-9A-Za-z])$/.test(this.nif().trim()));
  readonly canSave = computed(
    () => this.validNif() && [this.nif(), ...Object.values(this.address())].some((value) => value.trim().length > 0),
  );

  constructor() {
    const user = this.userService.user();
    this.nif.set(user.nif);
    this.address.set({ ...user.address });
    effect(() => {
      const current = this.userService.user();
      untracked(() => {
        if (this.edited || this.saving()) return;
        this.nif.set(current.nif);
        this.address.set({ ...current.address });
      });
    });
  }

  setNif(value: string): void {
    this.edited = true;
    this.nif.set(value);
  }

  readonly provinceOptions = computed<readonly RegionOption[]>(() => {
    const country = normalizeName(this.address().country);
    if (SPAIN_NAMES.has(country)) return SPANISH_PROVINCES;
    return FRANCE_NAMES.has(country) ? FRENCH_PROVINCES : [];
  });
  readonly selectedProvince = computed(() => findByName(this.provinceOptions(), this.address().province, (option) => option.name));
  readonly municipalityOptions = computed<readonly string[]>(() => {
    const province = this.selectedProvince();
    return province ? (MUNICIPALITIES_BY_PROVINCE_ID[province.id] ?? []) : [];
  });

  setCountry(value: string): void {
    this.edited = true;
    this.address.update((current) => {
      if (normalizeName(current.country) === normalizeName(value)) return { ...current, country: value };
      return { ...current, country: value, province: '', city: '' };
    });
  }

  setProvince(value: string): void {
    this.edited = true;
    this.address.update((current) => {
      const previous = findByName(this.provinceOptions(), current.province, (option) => option.name);
      const next = findByName(this.provinceOptions(), value, (option) => option.name);
      return { ...current, province: value, city: previous?.id === next?.id ? current.city : '' };
    });
  }

  commitProvince(input: HTMLInputElement): void {
    if (!this.provinceOptions().length) return;
    const match = this.selectedProvince();
    input.value = match?.name ?? '';
    this.setProvince(input.value);
  }

  commitCity(input: HTMLInputElement): void {
    const options = this.municipalityOptions();
    if (!options.length) return;
    const match = findByName(options, input.value, (name) => name);
    input.value = match ?? '';
    this.setAddress('city', input.value);
  }

  setAddress<K extends keyof UserAddress>(key: K, value: string): void {
    this.edited = true;
    this.address.update((current) => ({ ...current, [key]: value }));
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    const current = this.address();
    if (!this.canSave()) return;
    if (this.saving()) return;

    this.requestError.set(null);
    this.saving.set(true);
    try {
      const result = await this.userService.save({ nif: this.nif().trim(), address: current });
      if (result.success) {
        this.saved.set(true);
      } else {
        this.saveFailed.set(true);
      }
    } catch (error) {
      this.requestError.set(error);
      this.saveFailed.set(true);
    } finally {
      this.saving.set(false);
    }
  }
}
