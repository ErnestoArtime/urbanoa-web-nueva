import { Component, inject, signal } from '@angular/core';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register-confirm',
  imports: [LucideEye, LucideEyeOff, TranslatePipe, FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-form">
        <h1 class="page-title">{{ 'auth.registerConfirm.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'auth.registerConfirm.subtitle' | translate }}</p>
        <div class="form-group">
          <label class="form-label">{{ 'auth.registerConfirm.code' | translate }}</label>
          <input class="form-input" placeholder="000000" [(ngModel)]="code" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ 'auth.registerConfirm.confirmPassword' | translate }}</label>
          <div class="password-field">
            <input class="form-input" [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" /><button
              type="button"
              (click)="togglePassword()"
              [attr.aria-label]="'auth.togglePassword' | translate"
            >
              @if (showPassword()) {
                <svg lucideEyeOff size="20"></svg>
              } @else {
                <svg lucideEye size="20"></svg>
              }
            </button>
          </div>
        </div>
        <button type="button" class="btn-text mb-2">{{ 'auth.registerConfirm.resend' | translate }}</button>
        <button type="button" class="btn btn-primary btn-block" (click)="submit()">{{ 'auth.registerConfirm.submit' | translate }}</button>
      </div>
    </div>
  `,
})
export class RegisterConfirmComponent {
  private readonly auth = inject(AuthService); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router);
  code = ''; password = '';
  readonly showPassword = signal(false);
  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }
  async submit(): Promise<void> { if (!this.code || !this.password) return; await this.auth.confirmRegister(this.route.snapshot.queryParamMap.get('email') ?? '', this.code, this.password); await this.router.navigate(['/onboarding/user']); }
}
