import { AfterViewInit, Component, ElementRef, OnDestroy, output, ViewChild } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PaymentLayoutComponent } from '../payment-layout/payment-layout.component';

@Component({
  selector: 'app-wallet-manager-modal',
  imports: [TranslatePipe, PaymentLayoutComponent],
  template: `
    <dialog #dialog aria-labelledby="wallet-manager-title" (cancel)="onCancel($event)">
      <header>
        <h2 id="wallet-manager-title">{{ 'parking.confirm.changePayment' | translate }}</h2>
        <button
          type="button"
          class="btn btn-ghost"
          [disabled]="manager.busy()"
          (click)="close()"
          [attr.aria-label]="'common.close' | translate"
        >
          ×
        </button>
      </header>
      <div class="wallet-content"><app-payment-layout #manager [embedded]="true" /></div>
      <footer>
        <button type="button" class="btn btn-primary" [disabled]="manager.busy()" (click)="close()">
          {{ 'common.accept' | translate }}
        </button>
      </footer>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(600px, calc(100vw - 2rem));
      max-height: calc(100dvh - 2rem);
      padding: 0;
      margin: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      color: var(--color-text);
      box-shadow: var(--shadow-md);
    }
    dialog[open] {
      display: flex;
      flex-direction: column;
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.45);
    }
    header,
    footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.8rem 1rem;
      flex: none;
    }
    header {
      border-bottom: 1px solid var(--color-border);
    }
    h2 {
      margin: 0;
      font-size: var(--text-lg);
    }
    footer {
      justify-content: flex-end;
      border-top: 1px solid var(--color-border);
    }
    .wallet-content {
      overflow-y: auto;
      min-height: 0;
      padding: 1rem;
    }
    @media (max-width: 480px) {
      dialog {
        width: calc(100vw - 1rem);
        max-height: calc(100dvh - 1rem);
      }
      .wallet-content {
        padding: 0.75rem;
      }
    }
  `,
})
export class WalletManagerModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dialog', { static: true }) private dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild(PaymentLayoutComponent) private manager!: PaymentLayoutComponent;
  readonly closed = output<void>();
  private previousOverflow = '';
  ngAfterViewInit(): void {
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.dialog.nativeElement.showModal();
  }
  ngOnDestroy(): void {
    this.dialog.nativeElement.close();
    document.body.style.overflow = this.previousOverflow;
  }
  onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }
  close(): void {
    if (this.manager.busy()) return;
    this.dialog.nativeElement.close();
    this.closed.emit();
  }
}
