import { Component } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';

@Component({
  selector: 'app-account-notifications',
  imports: [TranslatePipe, DetailPanelHeaderComponent],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.notifications.title' | translate }}</h1>
      <div class="card">
        <p class="section-title">{{ 'account.notifications.app' | translate }}</p>
        @for (notif of appNotifications; track notif.key) {
          <label class="switch-row"
            ><span>{{ notif.labelKey | translate }}</span
            ><input type="checkbox" [checked]="notif.enabled" /><span class="switch"></span
          ></label>
        }
      </div>
      <div class="card mt-1">
        <p class="section-title">{{ 'account.notifications.email' | translate }}</p>
        <p class="text-muted">{{ 'account.notifications.emailHint' | translate }}</p>
        @for (notif of emailNotifications; track notif.key) {
          <label class="switch-row"
            ><span>{{ notif.labelKey | translate }}</span
            ><input type="checkbox" [checked]="notif.enabled" /><span class="switch"></span
          ></label>
        }
      </div>
      <button class="btn btn-primary btn-block mt-2">{{ 'account.notifications.save' | translate }}</button>
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
export class AccountNotificationsComponent {
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
}
