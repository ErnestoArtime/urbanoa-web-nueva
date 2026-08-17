import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [RouterLink, TranslatePipe, FormsModule],
  template: `
    <div class="page auth-page">
      <h1 class="page-title">{{ 'auth.reset.title' | translate }}</h1>
      <div class="form-group">
        <label class="form-label">{{ 'account.profile.email' | translate }}</label>
        <input class="form-input" type="email" autocomplete="email" [(ngModel)]="email" />
      </div>
      <button type="button" class="btn btn-primary btn-block" (click)="submit()">{{ 'auth.reset.generateCode' | translate }}</button>
      <p class="text-center mt-2"><a routerLink="/auth/login">{{ 'auth.reset.backToLogin' | translate }}</a></p>
    </div>
  `,
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  email = '';
  async submit(): Promise<void> { if (!this.email.trim()) return; await this.auth.requestPasswordReset(this.email); await this.router.navigate(['/auth/reset-password-code'], { queryParams: { email: this.email } }); }
}
