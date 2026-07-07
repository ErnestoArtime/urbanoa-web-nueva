import { Component } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';

@Component({
  selector: 'app-account-change-password',
  imports: [TranslatePipe, DetailPanelHeaderComponent],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.changePassword.title' | translate }}</h1>
      <div class="card">
        <div class="form-group">
          <label>{{ 'account.changePassword.current' | translate }} <span class="text-error">*</span></label
          ><input class="form-input" type="password" />
        </div>
        <div class="form-group">
          <label>{{ 'account.changePassword.new' | translate }} <span class="text-error">*</span></label
          ><input class="form-input" type="password" /><small class="text-muted">{{ 'account.changePassword.minLength' | translate }}</small>
        </div>
        <div class="form-group">
          <label>{{ 'account.changePassword.confirm' | translate }} <span class="text-error">*</span></label
          ><input class="form-input" type="password" />
        </div>
        <button class="btn btn-primary btn-block">{{ 'common.save' | translate }}</button>
      </div>
    </div>
  `,
  styles: [':host{display:block}'],
})
export class AccountChangePasswordComponent {}
