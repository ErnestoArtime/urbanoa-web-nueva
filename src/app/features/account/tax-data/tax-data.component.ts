import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { UserService, type UserAddress } from '../../../core/services/user.service';

@Component({
  selector: 'app-account-tax-data',
  imports: [TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header [title]="'account.taxData.title' | translate" backRoute="/app/account" />
      <div class="card">
        <div class="form-group">
          <label>{{ 'account.taxData.nif' | translate }} <span class="text-error">*</span></label
          ><input
            class="form-input"
            [value]="nif()"
            (input)="nif.set($any($event.target).value)"
            [placeholder]="'account.taxData.nif' | translate"
          />
          @if (submitted() && !nif()) {
            <p class="form-error">{{ 'common.required' | translate }}</p>
          }
        </div>
        <div class="form-group">
          <label>{{ 'account.taxData.street' | translate }} <span class="text-error">*</span></label
          ><input
            class="form-input"
            [value]="address().street"
            (input)="setAddress('street', $any($event.target).value)"
            [placeholder]="'account.taxData.street' | translate"
          />
          @if (submitted() && !address().street) {
            <p class="form-error">{{ 'common.required' | translate }}</p>
          }
        </div>
        <div class="form-group">
          <label>{{ 'account.taxData.number' | translate }} <span class="text-error">*</span></label
          ><input
            class="form-input"
            [value]="address().number"
            (input)="setAddress('number', $any($event.target).value)"
            [placeholder]="'account.taxData.numberRequired' | translate"
          />
          @if (submitted() && !address().number) {
            <p class="form-error">{{ 'common.required' | translate }}</p>
          }
        </div>
        <div class="row">
          <div class="form-group">
            <label>{{ 'account.taxData.floor' | translate }}</label
            ><input
              class="form-input"
              [value]="address().floor"
              (input)="setAddress('floor', $any($event.target).value)"
              [placeholder]="'account.taxData.floor' | translate"
            />
          </div>
          <div class="form-group">
            <label>{{ 'account.taxData.door' | translate }}</label
            ><input
              class="form-input"
              [value]="address().door"
              (input)="setAddress('door', $any($event.target).value)"
              [placeholder]="'account.taxData.door' | translate"
            />
          </div>
        </div>
        <div class="row">
          <div class="form-group">
            <label>{{ 'account.taxData.stair' | translate }}</label
            ><input
              class="form-input"
              [value]="address().stair"
              (input)="setAddress('stair', $any($event.target).value)"
              [placeholder]="'account.taxData.stair' | translate"
            />
          </div>
          <div class="form-group">
            <label>{{ 'account.taxData.letter' | translate }}</label
            ><input
              class="form-input"
              [value]="address().letter"
              (input)="setAddress('letter', $any($event.target).value)"
              [placeholder]="'account.taxData.letter' | translate"
            />
          </div>
        </div>
        <div class="form-group">
          <label>{{ 'account.taxData.city' | translate }} <span class="text-error">*</span></label
          ><input
            class="form-input"
            [value]="address().city"
            (input)="setAddress('city', $any($event.target).value)"
            [placeholder]="'account.taxData.city' | translate"
          />
          @if (submitted() && !address().city) {
            <p class="form-error">{{ 'common.required' | translate }}</p>
          }
        </div>
        <div class="form-group">
          <label>{{ 'account.taxData.province' | translate }} <span class="text-error">*</span></label
          ><input
            class="form-input"
            [value]="address().province"
            (input)="setAddress('province', $any($event.target).value)"
            [placeholder]="'account.taxData.province' | translate"
          />
          @if (submitted() && !address().province) {
            <p class="form-error">{{ 'common.required' | translate }}</p>
          }
        </div>
        <div class="form-group">
          <label>{{ 'account.taxData.postalCode' | translate }} <span class="text-error">*</span></label
          ><input
            class="form-input"
            [value]="address().postalCode"
            (input)="setAddress('postalCode', $any($event.target).value)"
            [placeholder]="'account.taxData.postalCode' | translate"
          />
          @if (submitted() && !address().postalCode) {
            <p class="form-error">{{ 'common.required' | translate }}</p>
          }
        </div>
        <button type="button" class="btn btn-primary btn-block" [disabled]="saving()" (click)="save()">
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
          [message]="'account.taxData.saveErrorDetail' | translate"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="saveFailed.set(false)"
        />
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
    `,
  ],
})
export class AccountTaxDataComponent {
  private readonly userService = inject(UserService);

  readonly nif = signal('');
  readonly address = signal<UserAddress>({ ...this.userService.user().address });
  readonly submitted = signal(false);
  readonly saved = signal(false);
  readonly saving = signal(false);
  readonly saveFailed = signal(false);

  constructor() {
    const user = this.userService.user();
    this.nif.set(user.nif);
    this.address.set({ ...user.address });
  }

  setAddress<K extends keyof UserAddress>(key: K, value: string): void {
    this.address.update((current) => ({ ...current, [key]: value }));
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    const current = this.address();
    if (!this.nif() || !current.street || !current.number || !current.city || !current.province || !current.postalCode) {
      return;
    }
    if (this.saving()) return;

    this.saving.set(true);
    const result = await this.userService.save({ nif: this.nif(), address: current });
    this.saving.set(false);
    if (result.success) {
      this.saved.set(true);
    } else {
      this.saveFailed.set(true);
    }
  }
}
