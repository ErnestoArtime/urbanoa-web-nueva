import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-reset-password-code',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page auth-page">
      <h1 class="page-title">{{ 'auth.resetCode.title' | translate }}</h1>
      <p class="page-subtitle">{{ 'auth.resetCode.subtitle' | translate }}</p>
      <a routerLink="/auth/reset-password-confirm" class="btn btn-primary btn-block mt-2">{{ 'auth.resetCode.enterCode' | translate }}</a>
    </div>
  `,
})
export class ResetPasswordCodeComponent {}
