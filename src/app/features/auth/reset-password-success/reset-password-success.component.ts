import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideShieldCheck } from '@lucide/angular';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-reset-password-success',
  imports: [RouterLink, LucideShieldCheck, TranslatePipe],
  template: `
    <main class="auth-page auth-page-centered success-page">
      <section class="auth-panel success-card">
        <div class="success-mark" aria-hidden="true"><svg lucideShieldCheck size="44"></svg></div>
        <p class="success-eyebrow">{{ 'auth.resetSuccess.eyebrow' | translate }}</p>
        <h1 class="auth-flow-title">{{ 'auth.resetSuccess.title' | translate }}</h1>
        <p class="auth-flow-intro">{{ 'auth.resetSuccess.subtitle' | translate }}</p>
        <a routerLink="/auth/login" class="btn btn-primary btn-block">{{ 'auth.resetSuccess.login' | translate }}</a>
      </section>
    </main>
  `,
  styleUrls: ['../../../shared/styles/auth-panel.css', '../../../shared/styles/auth-flow.css', './reset-password-success.component.css'],
})
export class ResetPasswordSuccessComponent {}
