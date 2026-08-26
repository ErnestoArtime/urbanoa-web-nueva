import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { WalletService } from '../../../core/services/wallet.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-payment-add',
  imports: [TranslatePipe, DetailPanelHeaderComponent],
  template: `
    <div class="page account-static-page paycomet-page">
      <app-detail-panel-header backRoute="/app/account/payment-methods" [title]="'account.addCard.title' | translate" [backDesktop]="true" />
      @if (loading()) {
        <div class="state"><span class="spinner"></span><p>{{ 'account.addCard.loading' | translate }}</p></div>
      } @else if (error()) {
        <div class="state" role="alert">
          <p>{{ 'account.addCard.formError' | translate }}</p>
          <button type="button" class="btn btn-primary" (click)="loadForm()">{{ 'common.retry' | translate }}</button>
        </div>
      } @else if (success()) {
        <div class="state"><span class="success-mark">✓</span><h2>{{ 'account.addCard.successTitle' | translate }}</h2>
          <p>{{ 'account.addCard.successHint' | translate }}</p>
          <button type="button" class="btn btn-primary" (click)="goBack()">{{ 'account.addCard.backToList' | translate }}</button>
        </div>
      } @else if (formHtml()) {
        <iframe
          class="paycomet-frame"
          title="Paycomet"
          [srcdoc]="formHtml()!"
          sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-modals"
        ></iframe>
        <p class="secure-note">{{ 'account.addCard.secureCheckout' | translate }} · {{ 'account.addCard.paycomet' | translate }}</p>
      }
    </div>
  `,
  styles: `
    .paycomet-page { padding-bottom: 2rem; }
    .paycomet-frame { width: 100%; min-height: 560px; margin-top: 1rem; border: 0; border-radius: var(--radius-md); background: #fff; }
    .state { display: grid; justify-items: center; gap: 1rem; margin-top: 3rem; text-align: center; color: var(--color-text-muted); }
    .spinner { width: 42px; height: 42px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin .8s linear infinite; }
    .success-mark { display: grid; width: 68px; height: 68px; place-items: center; border-radius: 22px; background: var(--color-primary); color: #fff; font-size: 2rem; }
    .secure-note { margin-top: .8rem; color: var(--color-text-muted); font-size: var(--text-xs); text-align: center; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `,
})
export class PaymentAddComponent implements OnInit, OnDestroy {
  private readonly wallet = inject(WalletService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly onMessage = (event: MessageEvent): void => {
    if (event.data === 'urbanoa-card-added') void this.onCardAdded();
  };

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly success = signal(false);
  readonly formHtml = signal<SafeHtml | null>(null);

  ngOnInit(): void {
    window.addEventListener('message', this.onMessage);
    void this.loadForm();
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.onMessage);
  }

  async loadForm(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    const html = await this.wallet.loadPaymentMethodForm();
    if (!html) {
      this.formHtml.set(null);
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    const bridgedHtml = html.replace(
      /window\.Urbanoa\.finish\(\)/g,
      "window.parent.postMessage('urbanoa-card-added', '*'); window.Urbanoa.finish()",
    );
    this.formHtml.set(this.sanitizer.bypassSecurityTrustHtml(bridgedHtml));
    this.loading.set(false);
  }

  private async onCardAdded(): Promise<void> {
    await this.wallet.load();
    this.success.set(true);
  }

  goBack(): void {
    void this.router.navigate(['/app/account/payment-methods']);
  }
}
