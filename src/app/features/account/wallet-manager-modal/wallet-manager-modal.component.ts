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
  styleUrl: './wallet-manager-modal.component.css',
})
export class WalletManagerModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dialog', { static: true }) private dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild(PaymentLayoutComponent) private manager!: PaymentLayoutComponent;
  readonly closed = output<void>();
  private previousScrollLock = false;
  ngAfterViewInit(): void {
    this.previousScrollLock = document.body.classList.contains('wallet-modal-open');
    document.body.classList.add('wallet-modal-open');
    this.dialog.nativeElement.showModal();
  }
  ngOnDestroy(): void {
    this.dialog.nativeElement.close();
    document.body.classList.toggle('wallet-modal-open', this.previousScrollLock);
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
