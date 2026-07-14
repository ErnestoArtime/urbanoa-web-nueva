import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-reset-password',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page auth-page">
      <h1 class="page-title">{{ 'auth.reset.title' | translate }}</h1>
      <div class="form-group">
        <label class="form-label">{{ 'account.profile.email' | translate }}</label>
        <input class="form-input" type="email" autocomplete="email" />
      </div>
      <a routerLink="/auth/reset-password-code" class="btn btn-primary btn-block">{{ 'auth.reset.generateCode' | translate }}</a>
      <p class="text-center mt-2"><a routerLink="/auth/login">{{ 'auth.reset.backToLogin' | translate }}</a></p>
    </div>
  `,
})
export class ResetPasswordComponent {}
