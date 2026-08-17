import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, LucideEye, LucideEyeOff, TranslatePipe, FormsModule],
  template: `
    <main class="auth-page apk-auth-page">
      <section class="auth-panel">
        <img src="/assets/brand/arinpark-logo.png" [alt]="brand.name" class="apk-auth-logo" />
        <h1>{{ 'auth.login.title' | translate }}</h1>
        <p class="auth-intro">{{ 'auth.login.subtitle' | translate }}</p>
        <label class="outlined-field"
          ><span>{{ 'auth.login.email' | translate }}</span
          ><input type="email" placeholder="xxx@yyy.zzz" autocomplete="email" [(ngModel)]="email"
        /></label>
        <label class="outlined-field"
          ><span>{{ 'auth.login.password' | translate }}</span>
          <div class="password-field">
            <input [type]="showPassword() ? 'text' : 'password'" placeholder="••••••••" autocomplete="current-password" [(ngModel)]="password" /><button
              type="button"
              (click)="togglePassword()"
              [attr.aria-label]="'auth.togglePassword' | translate"
            >
              @if (showPassword()) {
                <svg lucideEyeOff size="20"></svg>
              } @else {
                <svg lucideEye size="20"></svg>
              }
            </button></div
        ></label>
        <a routerLink="/auth/reset-password" class="recover-link">{{ 'auth.login.forgotPassword' | translate }}</a>
        <button type="button" class="btn btn-primary btn-block login-button" [disabled]="loading()" (click)="submit()">{{ 'auth.login.title' | translate }}</button>
        <p class="register-link">
          {{ 'auth.login.noAccount' | translate }}
          <a routerLink="/auth/register">{{ 'auth.login.register' | translate }}</a>
        </p>
      </section>
    </main>
  `,
  styles: [
    `
      .apk-auth-page {
        justify-content: center;
        background: var(--color-background);
      }
      .auth-panel {
        width: min(100%, 420px);
        padding: 2rem 2.2rem;
        border: 1px solid var(--color-border);
        border-radius: 22px;
        background: var(--color-surface);
        box-shadow: var(--shadow-md);
      }
      .apk-auth-logo {
        display: block;
        width: 230px;
        max-width: 75%;
        height: auto;
        margin: 0 auto 2rem;
      }
      .auth-panel h1 {
        text-align: center;
        font-size: var(--text-2xl);
      }
      .auth-intro {
        text-align: center;
        color: var(--color-text-muted);
        margin: 0.35rem 0 1.5rem;
      }
      .outlined-field {
        position: relative;
        display: block;
        margin: 1rem 0;
      }
      .outlined-field span {
        position: absolute;
        z-index: 1;
        top: -0.55rem;
        left: 0.8rem;
        padding: 0 0.35rem;
        background: var(--color-surface);
        color: var(--color-primary);
        font-size: var(--text-xs);
      }
      .outlined-field input {
        width: 100%;
        min-height: 54px;
        padding: 0.85rem 1rem;
        border: 1px solid var(--color-primary);
        border-radius: 6px;
        background: transparent;
        font: inherit;
      }
      .password-field {
        position: relative;
        width: 100%;
      }
      .password-field input {
        width: 100%;
        padding-right: 44px;
        box-sizing: border-box;
      }
      .password-field button {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 0;
        background: transparent;
        color: var(--color-text-muted);
        cursor: pointer;
        padding: 0;
      }
      .password-field button svg {
        width: 22px;
        height: 22px;
      }
      .outlined-field input:focus {
        outline: 2px solid rgba(43, 103, 103, 0.15);
      }
      .recover-link {
        display: block;
        text-align: right;
        margin: 0.2rem 0 1.2rem;
        font-size: var(--text-sm);
      }
      .login-button {
        min-height: 50px;
      }
      .register-link {
        text-align: center;
        margin-top: 1.2rem;
        color: var(--color-text-muted);
      }
      @media (max-width: 520px) {
        .auth-panel {
          padding: 1.5rem;
          border: 0;
          box-shadow: none;
          background: transparent;
        }
        .outlined-field span {
          background: var(--color-background);
        }
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }
  readonly brand = APP_BRAND;

  async submit(): Promise<void> {
    if (!this.email.trim() || !this.password) return;
    this.loading.set(true);
    try { await this.auth.login({ email: this.email, password: this.password }); await this.router.navigate(['/app']); }
    finally { this.loading.set(false); }
  }
}
