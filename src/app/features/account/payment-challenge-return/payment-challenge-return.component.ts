import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OperationsService } from '../../../core/services/operations.service';
import { PaymentChallengeService, PendingRechargeChallenge } from '../../../core/services/payment-challenge.service';
import { WalletService } from '../../../core/services/wallet.service';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-payment-challenge-return',
  imports: [ResultModalComponent, TranslatePipe],
  template: `
    @if (completed()) {
      <app-result-modal
        type="success"
        [title]="'account.recharge.success' | translate"
        [message]="'account.recharge.successDetail' | translate: { amount: recharge()?.amount + ',00 €' }"
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
  readonly recharge = signal<PendingRechargeChallenge | null>(null);

  ngOnInit(): void {
    const outcome = this.route.snapshot.data['outcome'];
    if (outcome !== 'ok') {
      this.paymentChallenge.clear();
      void this.router.navigate(['/app/account/payment-methods/recharge']);
      return;
    }

    this.recharge.set(this.paymentChallenge.consumeRecharge());
    // APK parity: Paycomet's /ok return is considered a successful challenge.
    // A future backend status endpoint must replace this client-side conclusion.
    void this.refreshAndShowSuccess();
  }

  finish(): void {
    this.paymentChallenge.clear();
    void this.router.navigate(['/app/account/payment-methods/recharge']);
  }

  private async refreshAndShowSuccess(): Promise<void> {
    await Promise.allSettled([this.walletService.load(), this.operationsService.load()]);
    this.completed.set(true);
  }
}
