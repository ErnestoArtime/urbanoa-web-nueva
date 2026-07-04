import { Component } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-change-password',
  imports: [TranslatePipe],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.changePassword.title' | translate }}</h1>
      <div class="card">
        <div class="form-group">
          <label>{{ 'account.changePassword.current' | translate }} <span class="text-error">*</span></label
          ><input class="form-input" type="password" /><small class="form-error">{{
            'account.changePassword.currentRequired' | translate
          }}</small>
        </div>
        <div class="form-group">
          <label>{{ 'account.changePassword.new' | translate }} <span class="text-error">*</span></label
          ><input class="form-input" type="password" /><small class="form-error">{{
            'account.changePassword.newRequired' | translate
          }}</small
          ><small>{{ 'account.changePassword.minLength' | translate }}</small>
        </div>
        <div class="form-group">
          <label>{{ 'account.changePassword.confirm' | translate }} <span class="text-error">*</span></label
          ><input class="form-input" type="password" /><small class="form-error">{{
            'account.changePassword.confirmRequired' | translate
          }}</small>
        </div>
        <button class="btn btn-primary btn-block">{{ 'common.save' | translate }}</button>
      </div>
    </div>
  `,
  styles: [':host{display:block}'],
})
export class AccountChangePasswordComponent {}
