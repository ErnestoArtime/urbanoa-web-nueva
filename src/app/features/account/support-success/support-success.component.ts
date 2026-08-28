import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideCheck, LucideMessageCircle } from '@lucide/angular';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-support-success',
  imports: [LucideCheck, LucideMessageCircle, TranslatePipe],
  template: `
    <div class="page account-static-page support-success-page">
      <div class="success-mark" aria-hidden="true"><svg lucideCheck size="32" strokeWidth="2.5"></svg></div>
      <p class="success-kicker">{{ 'account.supportSuccess.received' | translate }}</p>
      <h1>{{ 'account.supportSuccess.title' | translate }}</h1>
      <p class="success-detail">{{ 'account.supportSuccess.detail' | translate }}</p>
      <div class="success-reference">
        <svg lucideMessageCircle size="19"></svg>
        <span>{{ 'account.supportSuccess.threadCreated' | translate }}</span>
      </div>
      <button class="btn btn-primary" (click)="goBack()">{{ 'account.supportSuccess.button' | translate }}</button>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .support-success-page {
      display: flex;
      min-height: 100%;
      max-width: 520px;
      margin: 0 auto;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .success-mark {
      display: grid;
      place-items: center;
      width: 76px;
      height: 76px;
      margin-bottom: 1rem;
      border-radius: 28px;
      background: var(--color-accent-soft);
      color: var(--color-primary-dark);
      box-shadow: 0 12px 30px rgba(40, 115, 111, 0.18);
      transform: rotate(-4deg);
    }
    .success-kicker {
      color: var(--color-primary);
      font-size: var(--text-xs);
      font-weight: var(--font-extra);
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    h1 {
      margin-top: 0.3rem;
      font-size: var(--text-2xl);
    }
    .success-detail {
      max-width: 30rem;
      margin-top: 0.55rem;
      color: var(--color-text-muted);
      line-height: var(--line-readable);
    }
    .success-reference {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 1.25rem 0;
      padding: 0.65rem 0.9rem;
      border-radius: var(--radius-pill);
      background: #dbe5de;
      color: var(--color-primary-dark);
      font-size: var(--text-sm);
      font-weight: var(--font-bold);
    }
    .btn {
      min-width: 220px;
    }
  `,
})
export class AccountSupportSuccessComponent {
  private readonly router = inject(Router);

  goBack(): void {
    void this.router.navigate(['/app/account/support']);
  }
}
