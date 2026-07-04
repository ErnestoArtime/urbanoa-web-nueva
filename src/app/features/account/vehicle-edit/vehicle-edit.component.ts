import { Component } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-vehicle-edit',
  imports: [TranslatePipe],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.vehicleEdit.title' | translate }}</h1>
      <div class="card">
        <div class="form-group"><label>{{ 'account.vehicleEdit.plate' | translate }}</label><input class="form-input" value="1234 ABC"/></div>
        <label class="switch-row"><span>{{ 'account.vehicleEdit.favorite' | translate }}</span><input type="checkbox" checked/><span class="switch"></span></label>
        <button class="btn btn-primary btn-block mt-2">{{ 'account.vehicleEdit.save' | translate }}</button>
        <button class="btn btn-danger btn-block mt-1">{{ 'account.vehicleEdit.delete' | translate }}</button>
      </div>
    </div>
  `,
  styles: [`
    .switch-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.65rem 0;cursor:pointer}.switch{position:relative;width:44px;height:24px;border-radius:99px;background:var(--color-border);transition:background .2s;flex-shrink:0}.switch::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s}input:checked+.switch{background:var(--color-primary)}input:checked+.switch::after{left:22px}
  `],
})
export class VehicleEditComponent {}
