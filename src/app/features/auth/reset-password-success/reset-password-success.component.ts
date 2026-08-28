import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideShieldCheck } from '@lucide/angular';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-reset-password-success',
  imports: [RouterLink, LucideShieldCheck, TranslatePipe],
  template: `
    <main class="auth-page success-page">
      <section class="auth-form success-card">
        <div class="success-mark" aria-hidden="true"><svg lucideShieldCheck size="44"></svg></div>
        <p class="success-eyebrow">{{ 'auth.resetSuccess.eyebrow' | translate }}</p>
        <h1 class="page-title">{{ 'auth.resetSuccess.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'auth.resetSuccess.subtitle' | translate }}</p>
        <a routerLink="/auth/login" class="btn btn-primary btn-block">{{ 'auth.resetSuccess.login' | translate }}</a>
      </section>
    </main>
  `,
  styles: [
    `
      .success-page {
        text-align: center;
      }
      .success-card {
        padding-block: 2rem;
      }
      .success-mark {
        display: grid;
        place-items: center;
        width: 82px;
        height: 82px;
        margin: 0 auto 1rem;
        border-radius: 28px;
        color: #fff;
        background: linear-gradient(145deg, var(--color-primary), #176b54);
        box-shadow: 0 14px 30px rgba(22, 107, 84, 0.2);
      }
      .success-eyebrow {
        margin-bottom: 0.4rem;
        color: var(--color-primary);
        font-size: var(--text-xs);
        font-weight: var(--font-bold);
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .btn {
        margin-top: 1.25rem;
      }
    `,
  ],
})
export class ResetPasswordSuccessComponent {}
