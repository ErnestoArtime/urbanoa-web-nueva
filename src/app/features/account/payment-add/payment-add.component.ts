import { ApiErrorPipe } from '../../../shared/pipes/api-error.pipe';
import { Component, ElementRef, ViewChild, input, output, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { WalletService } from '../../../core/services/wallet.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-payment-add',
  imports: [ApiErrorPipe, TranslatePipe, DetailPanelHeaderComponent],
  template: `
    <div class="page account-static-page paycomet-page">
      @if (!embedded()) {
        <app-detail-panel-header
          backRoute="/app/account/payment-methods"
          [title]="'account.addCard.title' | translate"
          [backDesktop]="true"
        />
      } @else {
        <h2>{{ 'account.addCard.title' | translate }}</h2>
      }
      @if (loading()) {
        <div class="state">
          <span class="spinner"></span>
          <p>{{ 'account.addCard.loading' | translate }}</p>
        </div>
      } @else if (error()) {
        <div class="state" role="alert">
          <p>
            {{
              (confirmationError() ? wallet.responseError() : requestError())
                | apiError: (confirmationError() ? 'account.addCard.confirmError' : 'account.addCard.formError')
            }}
          </p>
          <button type="button" class="btn btn-primary" (click)="retry()">{{ 'common.retry' | translate }}</button>
        </div>
      } @else if (success()) {
        <div class="state">
          <span class="success-mark">✓</span>
          <h2>{{ 'account.addCard.successTitle' | translate }}</h2>
          <p>{{ 'account.addCard.successHint' | translate }}</p>
          <button type="button" class="btn btn-primary" (click)="goBack()">{{ 'account.addCard.backToList' | translate }}</button>
        </div>
      } @else if (formHtml()) {
        <iframe
          #paymentFrame
          class="paycomet-frame"
          title="Paycomet"
          [srcdoc]="formHtml()!"
          sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-modals"
        ></iframe>
        <p class="secure-note">{{ 'account.addCard.secureCheckout' | translate }} · {{ 'account.addCard.paycomet' | translate }}</p>
      }
    </div>
  `,
  styleUrl: './payment-add.component.css',
})
export class PaymentAddComponent implements OnInit, OnDestroy {
  readonly requestError = signal<unknown>(null);
  @ViewChild('paymentFrame') private paymentFrame?: ElementRef<HTMLIFrameElement>;
  readonly embedded = input(false);
  readonly back = output<void>();
  readonly added = output<void>();

  readonly wallet = inject(WalletService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly onMessage = (event: MessageEvent): void => {
    if (
      event.data === 'urbanoa-card-added' &&
      event.source === this.paymentFrame?.nativeElement.contentWindow &&
      event.origin === window.location.origin
    )
      void this.onCardAdded();
  };
  private baselineCardIds = new Set<string>();
  private requestRevision = 0;
  private destroyed = false;
  private checkingCard = false;

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly success = signal(false);
  readonly confirmationError = signal(false);
  readonly formHtml = signal<SafeHtml | null>(null);

  ngOnInit(): void {
    window.addEventListener('message', this.onMessage);
    void this.loadForm();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.requestRevision++;
    window.removeEventListener('message', this.onMessage);
  }

  async loadForm(): Promise<void> {
    const revision = ++this.requestRevision;
    this.requestError.set(null);
    this.loading.set(true);
    this.error.set(false);
    this.confirmationError.set(false);
    this.success.set(false);
    this.formHtml.set(null);
    try {
      await this.wallet.load();
      if (this.destroyed || revision !== this.requestRevision) return;
      if (this.wallet.source() !== 'remote') throw new Error('Card catalogue unavailable');
      this.baselineCardIds = new Set(this.wallet.cards().map((card) => card.id));
      const html = await this.wallet.loadPaymentMethodForm();
      if (this.destroyed || revision !== this.requestRevision) return;
      if (!html) throw new Error('Payment form unavailable');
      const bridgedHtml = html.replace(
        /window\.Urbanoa\.finish\(\)/g,
        `window.parent.postMessage('urbanoa-card-added', ${JSON.stringify(window.location.origin)}); window.Urbanoa.finish()`,
      );
      this.formHtml.set(this.sanitizer.bypassSecurityTrustHtml(bridgedHtml));
    } catch (error) {
      if (!this.destroyed && revision === this.requestRevision) {
        this.requestError.set(this.wallet.responseError() ?? error);
        this.error.set(true);
      }
    } finally {
      if (!this.destroyed && revision === this.requestRevision) this.loading.set(false);
    }
  }

  private async onCardAdded(): Promise<void> {
    if (this.checkingCard || this.success() || this.destroyed) return;
    this.checkingCard = true;
    const revision = this.requestRevision;
    this.requestError.set(null);
    this.loading.set(true);
    this.error.set(false);
    try {
      await this.wallet.load();
      if (this.destroyed || revision !== this.requestRevision) return;
      const confirmed = this.wallet.source() === 'remote' && this.wallet.cards().some((card) => !this.baselineCardIds.has(card.id));
      this.success.set(confirmed);
      this.confirmationError.set(!confirmed);
      this.error.set(!confirmed);
      if (confirmed) this.added.emit();
    } catch (error) {
      if (!this.destroyed && revision === this.requestRevision) {
        this.requestError.set(this.wallet.responseError() ?? error);
        this.confirmationError.set(true);
        this.error.set(true);
      }
    } finally {
      this.checkingCard = false;
      if (!this.destroyed && revision === this.requestRevision) this.loading.set(false);
    }
  }

  retry(): void {
    if (this.confirmationError()) void this.onCardAdded();
    else void this.loadForm();
  }

  goBack(): void {
    if (this.embedded()) {
      this.back.emit();
      return;
    }
    void this.router.navigate(['/app/account/payment-methods']);
  }
}
