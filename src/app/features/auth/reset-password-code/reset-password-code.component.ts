import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password-code',
  imports: [TranslatePipe, FormsModule],
  template: `
    <div class="page auth-page">
      <h1 class="page-title">{{ 'auth.resetCode.title' | translate }}</h1>
      <p class="page-subtitle">{{ 'auth.resetCode.subtitle' | translate }}</p>
      <input class="form-input" inputmode="numeric" [(ngModel)]="code" placeholder="000000" />
      <button type="button" class="btn btn-primary btn-block mt-2" (click)="submit()">{{ 'auth.resetCode.enterCode' | translate }}</button>
    </div>
  `,
})
export class ResetPasswordCodeComponent {
  private readonly auth = inject(AuthService); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router);
  code = '';
  async submit(): Promise<void> { if (!this.code.trim()) return; const email = this.route.snapshot.queryParamMap.get('email') ?? ''; await this.auth.verifyResetCode(email, this.code); await this.router.navigate(['/auth/reset-password-confirm'], { queryParams: { email, code: this.code } }); }
}
