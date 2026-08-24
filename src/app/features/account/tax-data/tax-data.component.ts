import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { UserService } from '../../../core/services/user.service';

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
            [value]="street()"
            (input)="street.set($any($event.target).value)"
            [placeholder]="'account.taxData.street' | translate"
          />
          @if (submitted() && !street()) {
            <p class="form-error">{{ 'common.required' | translate }}</p>
          }
        </div>
        <div class="form-group">
          <label>{{ 'account.taxData.number' | translate }} <span class="text-error">*</span></label
          ><input
            class="form-input"
            [value]="number()"
            (input)="number.set($any($event.target).value)"
            [placeholder]="'account.taxData.numberRequired' | translate"
          />
          @if (submitted() && !number()) {
            <p class="form-error">{{ 'common.required' | translate }}</p>
          }
        </div>
        <div class="form-group">
          <label>{{ 'account.taxData.floor' | translate }}</label
          ><input
            class="form-input"
            [value]="floor()"
            (input)="floor.set($any($event.target).value)"
            [placeholder]="'account.taxData.floor' | translate"
          />
        </div>
        <div class="form-group">
          <label>{{ 'account.taxData.city' | translate }} <span class="text-error">*</span></label
          ><input
            class="form-input"
            [value]="city()"
            (input)="city.set($any($event.target).value)"
            [placeholder]="'account.taxData.city' | translate"
          />
          @if (submitted() && !city()) {
            <p class="form-error">{{ 'common.required' | translate }}</p>
          }
        </div>
        <div class="form-group">
          <label>{{ 'account.taxData.province' | translate }} <span class="text-error">*</span></label
          ><input
            class="form-input"
            [value]="province()"
            (input)="province.set($any($event.target).value)"
            [placeholder]="'account.taxData.province' | translate"
          />
          @if (submitted() && !province()) {
            <p class="form-error">{{ 'common.required' | translate }}</p>
          }
        </div>
        <div class="form-group">
          <label>{{ 'account.taxData.postalCode' | translate }} <span class="text-error">*</span></label
          ><input
            class="form-input"
            [value]="postalCode()"
            (input)="postalCode.set($any($event.target).value)"
            [placeholder]="'account.taxData.postalCode' | translate"
          />
          @if (submitted() && !postalCode()) {
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
          primaryText="Aceptar"
          (primaryAction)="saved.set(false)"
        />
      }
    </div>
  `,
  styles: [':host{display:block}'],
})
export class AccountTaxDataComponent implements OnInit {
  readonly nif = signal('');
  readonly street = signal('');
  readonly number = signal('');
  readonly floor = signal('');
  readonly city = signal('');
  readonly province = signal('');
  readonly postalCode = signal('');
  readonly submitted = signal(false);
  readonly saved = signal(false);
  readonly saving = signal(false);
  private readonly userService = inject(UserService);

  async ngOnInit(): Promise<void> {
    const user = await this.userService.load();
    this.nif.set(user.nif);
    this.street.set(user.street ?? '');
    this.number.set(user.buildingNumber ?? '');
    this.floor.set(user.floor ?? '');
    this.city.set(user.city ?? '');
    this.province.set(user.province ?? '');
    this.postalCode.set(user.postalCode ?? '');
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    if (!this.nif() || !this.street() || !this.number() || !this.city() || !this.province() || !this.postalCode()) {
      return;
    }
    this.saving.set(true);
    try {
      await this.userService.save({
        nif: this.nif(),
        street: this.street(),
        buildingNumber: this.number(),
        floor: this.floor(),
        city: this.city(),
        province: this.province(),
        postalCode: this.postalCode(),
      });
      this.saved.set(true);
    } finally {
      this.saving.set(false);
    }
  }
}
