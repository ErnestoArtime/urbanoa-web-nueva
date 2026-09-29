import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OperationsService } from '../../../core/services/operations.service';
import { PaymentChallengeService, PendingPaymentChallenge } from '../../../core/services/payment-challenge.service';
import { WalletService } from '../../../core/services/wallet.service';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-payment-challenge-return',
  imports: [ResultModalComponent, TranslatePipe],
  template: `
    @if (completed()) {
      <app-result-modal
        [type]="outcome() === 'ok' ? 'warning' : 'error'"
        [title]="(outcome() === 'ok' ? 'payment.challenge.pendingTitle' : 'payment.challenge.failedTitle') | translate"
        [message]="(outcome() === 'ok' ? 'payment.challenge.pendingMessage' : 'payment.challenge.failedMessage') | translate"
        [primaryText]="'common.accept' | translate"
        (primaryAction)="finish()"
      />
    }
  `,
})
export class PaymentChallengeReturnComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly walletService = inject(WalletService);
  private readonly operationsService = inject(OperationsService);
  private readonly paymentChallenge = inject(PaymentChallengeService);

  readonly completed = signal(false);
  readonly pending = signal<PendingPaymentChallenge | null>(null);
  readonly outcome = signal<'ok' | 'ko'>('ko');

  ngOnInit(): void {
    const outcome = this.route.snapshot.data['outcome'] === 'ok' ? 'ok' : 'ko';
    this.outcome.set(outcome);
    this.pending.set(this.paymentChallenge.getPending());

    if (outcome !== 'ok') {
      this.completed.set(true);
      return;
    }

    // The provider return only means that the challenge browser flow ended.
    // Backend reconciliation is required before any UI can claim success.
    void this.refreshAndShowPending();
  }

  finish(): void {
    const returnUrl = this.pending()?.returnUrl ?? '/app/operations';
    if (this.outcome() === 'ko') this.paymentChallenge.clear();
    void this.router.navigateByUrl(returnUrl);
  }

  private async refreshAndShowPending(): Promise<void> {
    await Promise.allSettled([this.walletService.load(), this.operationsService.load()]);
    this.completed.set(true);
  }
}
