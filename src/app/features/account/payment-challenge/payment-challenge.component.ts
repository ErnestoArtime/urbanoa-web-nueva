import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideCheck, LucideCreditCard, LucideLoaderCircle, LucideLockKeyhole, LucideShieldCheck } from '@lucide/angular';
import { PaymentChallengeService } from '../../../core/services/payment-challenge.service';
import { AccountApiService } from '../../../core/services/account-api.service';
import { WalletService } from '../../../core/services/wallet.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-payment-challenge',
  imports: [
    TranslatePipe,
    DetailPanelHeaderComponent,
    LucideCheck,
    LucideCreditCard,
    LucideLoaderCircle,
    LucideLockKeyhole,
    LucideShieldCheck,
  ],
  template: `
    <div class="page account-static-page challenge-page">
      <app-detail-panel-header
        backRoute="/app/account/payment-methods/add"
        [title]="'account.paymentChallenge.title' | translate"
        [backDesktop]="true"
      />
      @if (challenge.pendingCard(); as card) {
        <section class="challenge-card">
          <div class="secure-header">
            <div class="shield"><svg lucideShieldCheck size="32"></svg></div>
            <div>
              <span>{{ 'account.paymentChallenge.secureBy' | translate }}</span
              ><strong>PAYCOMET</strong>
            </div>
            <svg lucideLockKeyhole class="lock" size="20"></svg>
          </div>
          <div class="bank-panel">
            @if (stage() === 'ready') {
              <div class="bank-mark"><svg lucideCreditCard size="30"></svg></div>
              <p class="eyebrow">{{ 'account.paymentChallenge.verification' | translate }}</p>
              <h2>{{ 'account.paymentChallenge.approveTitle' | translate }}</h2>
              <p>{{ 'account.paymentChallenge.approveDescription' | translate }}</p>
              <dl>
                <div>
                  <dt>{{ 'account.paymentChallenge.card' | translate }}</dt>
                  <dd>{{ card.brand }} ···· {{ card.last4 }}</dd>
                </div>
                <div>
                  <dt>{{ 'account.paymentChallenge.merchant' | translate }}</dt>
                  <dd>ArinPark</dd>
                </div>
              </dl>
              <button type="button" class="btn btn-primary btn-block" (click)="approve()">
                {{ 'account.paymentChallenge.approve' | translate }}
              </button>
              <button type="button" class="btn btn-ghost btn-block" (click)="cancel()">{{ 'common.cancel' | translate }}</button>
            } @else if (stage() === 'processing') {
              <svg lucideLoaderCircle class="spinner" size="42"></svg>
              <h2>{{ 'account.paymentChallenge.processing' | translate }}</h2>
              <p>{{ 'account.paymentChallenge.processingHint' | translate }}</p>
            } @else {
              <div class="success-mark"><svg lucideCheck size="36"></svg></div>
              <h2>{{ 'account.paymentChallenge.success' | translate }}</h2>
              <p>{{ 'account.paymentChallenge.successHint' | translate }}</p>
            }
          </div>
          <p class="security-note"><svg lucideLockKeyhole size="14"></svg>{{ 'account.paymentChallenge.securityNote' | translate }}</p>
        </section>
      } @else {
        <section class="empty-challenge">
          <svg lucideCreditCard size="36"></svg>
          <h2>{{ 'account.paymentChallenge.noPending' | translate }}</h2>
          <button type="button" class="btn btn-primary" (click)="cancel()">{{ 'account.paymentChallenge.back' | translate }}</button>
        </section>
      }
    </div>
  `,
  styles: [
    `
      .challenge-page {
        max-width: 620px;
      }
      .challenge-card {
        margin-top: 1rem;
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: 24px;
        background: var(--color-surface);
        box-shadow: 0 18px 50px rgba(18, 63, 51, 0.1);
      }
      .secure-header {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.9rem 1rem;
        color: #fff;
        background: linear-gradient(120deg, #123f52, #176b54);
      }
      .shield {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 15px;
        background: rgba(255, 255, 255, 0.14);
      }
      .secure-header span,
      .secure-header strong {
        display: block;
      }
      .secure-header span {
        opacity: 0.72;
        font-size: var(--text-2xs);
      }
      .secure-header strong {
        letter-spacing: 0.08em;
      }
      .lock {
        margin-left: auto;
        opacity: 0.8;
      }
      .bank-panel {
        padding: 2rem 1.4rem 1.2rem;
        text-align: center;
      }
      .bank-mark,
      .success-mark {
        display: grid;
        place-items: center;
        width: 68px;
        height: 68px;
        margin: 0 auto 0.9rem;
        border-radius: 22px;
        color: var(--color-primary);
        background: var(--color-active);
      }
      .success-mark {
        color: white;
        background: var(--color-primary);
      }
      .eyebrow {
        margin: 0 0 0.25rem !important;
        color: var(--color-primary) !important;
        font-size: var(--text-2xs) !important;
        font-weight: var(--font-bold);
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      h2 {
        margin: 0;
        font-size: var(--text-xl);
      }
      .bank-panel > p {
        max-width: 390px;
        margin: 0.4rem auto 1rem;
        color: var(--color-text-muted);
        font-size: var(--text-sm);
        line-height: 1.5;
      }
      dl {
        margin: 1.2rem 0;
        padding: 0.3rem 0.9rem;
        border-radius: var(--radius-md);
        background: var(--color-background);
      }
      dl div {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.7rem 0;
        border-bottom: 1px solid var(--color-border);
        font-size: var(--text-sm);
      }
      dl div:last-child {
        border: 0;
      }
      dt {
        color: var(--color-text-muted);
      }
      dd {
        margin: 0;
        font-weight: var(--font-bold);
      }
      .spinner {
        margin: 1.5rem auto 1rem;
        color: var(--color-primary);
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .security-note {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.35rem;
        padding: 0.8rem;
        border-top: 1px solid var(--color-border);
        color: var(--color-text-muted);
        font-size: var(--text-2xs);
      }
      .empty-challenge {
        display: grid;
        justify-items: center;
        gap: 0.8rem;
        margin-top: 2rem;
        padding: 2rem;
        text-align: center;
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class PaymentChallengeComponent {
  readonly challenge = inject(PaymentChallengeService);
  readonly accountApi = inject(AccountApiService);
  private readonly wallet = inject(WalletService);
  private readonly router = inject(Router);
  readonly stage = signal<'ready' | 'processing' | 'success'>('ready');

  async approve(): Promise<void> {
    const card = this.challenge.pendingCard();
    if (!card || this.stage() !== 'ready') return;
    this.stage.set('processing');
    await this.accountApi.complete3ds({
      card: card.last4,
      brand: card.brand,
      expiryDate: card.expiryDate,
      cardholderName: card.cardholderName,
    });
    window.setTimeout(() => {
      this.wallet.addCard(card);
      this.stage.set('success');
      window.setTimeout(() => {
        this.challenge.clear();
        void this.router.navigate(['/app/account/payment-methods']);
      }, 900);
    }, 950);
  }
  cancel(): void {
    this.challenge.clear();
    void this.router.navigate(['/app/account/payment-methods']);
  }
}
