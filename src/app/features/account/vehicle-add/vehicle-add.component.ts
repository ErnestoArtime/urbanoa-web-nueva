import { Component } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-vehicle-add',
  imports: [TranslatePipe],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.vehicleAdd.title' | translate }}</h1>
      <div class="card">
        <div class="form-group">
          <label>{{ 'account.vehicleAdd.plate' | translate }} <span class="text-error">*</span></label
          ><input class="form-input" [placeholder]="'account.vehicleAdd.plate' | translate" /><small class="form-error">{{
            'account.vehicleAdd.plateRequired' | translate
          }}</small>
        </div>
        <label class="switch-row"
          ><span>{{ 'account.vehicleAdd.foreignPlate' | translate }}</span
          ><input type="checkbox" /><span class="switch"></span
        ></label>
        <label class="switch-row"
          ><span>{{ 'account.vehicleAdd.favorite' | translate }}</span
          ><input type="checkbox" /><span class="switch"></span
        ></label>
        <button class="btn btn-primary btn-block mt-2">{{ 'account.vehicleAdd.save' | translate }}</button>
      </div>
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
        border-radius: 99px;
        background: var(--color-border);
        transition: background 0.2s;
        flex-shrink: 0;
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
    `,
  ],
})
export class VehicleAddComponent {}
