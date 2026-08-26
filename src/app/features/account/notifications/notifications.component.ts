import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { NotificationsService } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-account-notifications',
  imports: [TranslatePipe, ResultModalComponent],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.notifications.title' | translate }}</h1>
      @if (notifications.source() === 'error') {
        <p class="data-notice" role="alert">No se pudieron sincronizar las preferencias con el servicio.</p>
      }
      <div class="card">
        <p class="section-title">{{ 'account.notifications.app' | translate }}</p>
        @for (notif of appNotifications; track notif.key) {
          <label class="switch-row"
            ><span>{{ notif.labelKey | translate }}</span
            ><input type="checkbox" [checked]="notif.enabled" (change)="notif.enabled = checked($event)" /><span class="switch"></span
          ></label>
        }
      </div>
      <div class="card mt-1">
        <p class="section-title">{{ 'account.notifications.email' | translate }}</p>
        <p class="text-muted">{{ 'account.notifications.emailHint' | translate }}</p>
        @for (notif of emailNotifications; track notif.key) {
          <label class="switch-row"
            ><span>{{ notif.labelKey | translate }}</span
            ><input type="checkbox" [checked]="notif.enabled" (change)="notif.enabled = checked($event)" /><span class="switch"></span
          ></label>
        }
      </div>
      <button type="button" class="btn btn-primary btn-block mt-2" [disabled]="saving()" (click)="save()">
        {{ 'account.notifications.save' | translate }}
      </button>
      @if (saved()) {
        <app-result-modal
          type="success"
          [title]="'account.notifications.successTitle' | translate"
          [message]="'account.notifications.successDetail' | translate"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="saved.set(false)"
        />
      }
    </div>
  `,
  styles: [
    `
      .switch-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.65rem 0;
        cursor: pointer;
      }
      .data-notice {
        margin: 0 0 1rem;
        padding: 0.75rem 0.9rem;
        border: 1px solid #e5b85c;
        border-radius: var(--radius-md);
        background: #fff8e7;
        color: #714b00;
      }
      .switch {
        position: relative;
        width: 44px;
        height: 24px;
        border-radius: 99px;
        background: var(--color-border);
        transition: background 0.2s;
        flex-shrink: 0;
      }
      .switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #fff;
        transition: left 0.2s;
      }
      input:checked + .switch {
        background: var(--color-primary);
      }
      input:checked + .switch::after {
        left: 22px;
      }
    `,
  ],
})
export class AccountNotificationsComponent implements OnInit {
  readonly notifications = inject(NotificationsService);
  readonly saved = signal(false);
  readonly saving = signal(false);
  readonly appNotifications = [
    { key: 'ending-parking', labelKey: 'account.notifications.endingParking', enabled: true },
    { key: 'fine-warning', labelKey: 'account.notifications.fineWarning', enabled: true },
    { key: 'recharge-confirm', labelKey: 'account.notifications.rechargeConfirm', enabled: true },
  ];
  readonly emailNotifications = [
    { key: 'parking-receipt', labelKey: 'account.notifications.parkingReceipt', enabled: true },
    { key: 'ending-parking', labelKey: 'account.notifications.endingParking', enabled: false },
    { key: 'fine-warning', labelKey: 'account.notifications.fineWarning', enabled: false },
    { key: 'recharge-confirm', labelKey: 'account.notifications.rechargeConfirm', enabled: false },
  ];

  async ngOnInit(): Promise<void> {
    const value = await this.notifications.load();
    this.appNotifications[0].enabled = value.unparkingNotifications === 1;
    this.appNotifications[1].enabled = value.fineNotifications === 1;
    this.appNotifications[2].enabled = value.rechargeNotifications === 1;
    this.emailNotifications[0].enabled = value.emailParkingNotifications === 1;
    this.emailNotifications[1].enabled = value.emailUnparkingNotifications === 1;
    this.emailNotifications[2].enabled = value.emailFineNotifications === 1;
    this.emailNotifications[3].enabled = value.emailRechargeNotifications === 1;
  }

  async save(): Promise<void> {
    this.saving.set(true);
    const current = this.notifications.preferences();
    const result = await this.notifications.save({
      ...current,
      unparkingNotifications: Number(this.appNotifications[0].enabled),
      fineNotifications: Number(this.appNotifications[1].enabled),
      rechargeNotifications: Number(this.appNotifications[2].enabled),
      emailParkingNotifications: Number(this.emailNotifications[0].enabled),
      emailUnparkingNotifications: Number(this.emailNotifications[1].enabled),
      emailFineNotifications: Number(this.emailNotifications[2].enabled),
      emailRechargeNotifications: Number(this.emailNotifications[3].enabled),
    });
    this.saving.set(false);
    this.saved.set(result === 'remote');
  }

  checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
