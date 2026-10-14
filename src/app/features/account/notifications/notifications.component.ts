import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { NotificationsService } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-account-notifications',
  imports: [TranslatePipe, ResultModalComponent, LoaderComponent],
  template: `
    <app-loader [visible]="loading() || saving()" [message]="'common.loading' | translate" />
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.notifications.title' | translate }}</h1>
      @if (notifications.source() === 'error') {
        <p class="data-notice" role="alert">{{ 'account.notifications.syncError' | translate }}</p>
      }
      @if (loadFailed()) {
        <button type="button" class="btn btn-secondary" (click)="loadPreferences()">{{ 'common.retry' | translate }}</button>
      }
      <div class="card">
        <p class="section-title">{{ 'account.notifications.app' | translate }}</p>
        @for (notif of appNotifications; track notif.key) {
          <label class="switch-row"
            ><span>{{ notif.labelKey | translate }}</span
            ><input
              type="checkbox"
              [disabled]="loading() || saving() || loadFailed()"
              [checked]="notif.enabled"
              (change)="notif.enabled = checked($event)" /><span class="switch"></span
          ></label>
        }
        <label class="switch-row"
          ><span>{{ 'account.notifications.feedback' | translate }}</span
          ><input
            type="checkbox"
            [disabled]="loading() || saving() || loadFailed()"
            [checked]="feedbackApp"
            (change)="feedbackApp = checked($event)" /><span class="switch"></span
        ></label>
      </div>
      <div class="card mt-1">
        <p class="section-title">{{ 'account.notifications.email' | translate }}</p>
        <p class="text-muted">{{ 'account.notifications.emailHint' | translate }}</p>
        @for (notif of emailNotifications; track notif.key) {
          <label class="switch-row"
            ><span>{{ notif.labelKey | translate }}</span
            ><input
              type="checkbox"
              [disabled]="loading() || saving() || loadFailed()"
              [checked]="notif.enabled"
              (change)="notif.enabled = checked($event)" /><span class="switch"></span
          ></label>
        }
        <label class="switch-row"
          ><span>{{ 'account.notifications.feedback' | translate }}</span
          ><input
            type="checkbox"
            [disabled]="loading() || saving() || loadFailed()"
            [checked]="feedbackEmail"
            (change)="feedbackEmail = checked($event)" /><span class="switch"></span
        ></label>
      </div>
      <button type="button" class="btn btn-primary btn-block mt-2" [disabled]="loading() || saving() || loadFailed()" (click)="save()">
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
  styleUrl: './notifications.component.css',
})
export class AccountNotificationsComponent implements OnInit {
  readonly notifications = inject(NotificationsService);
  readonly saved = signal(false);
  readonly saving = signal(false);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
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
  feedbackApp = true;
  feedbackEmail = false;

  async ngOnInit(): Promise<void> {
    await this.loadPreferences();
  }

  async loadPreferences(): Promise<void> {
    this.loading.set(true);
    this.loadFailed.set(false);
    try {
      const value = await this.notifications.load();
      if (this.notifications.source() !== 'remote') {
        this.loadFailed.set(true);
        return;
      }
      this.appNotifications[0].enabled = value.unparkingNotifications === 1;
      this.appNotifications[1].enabled = value.fineNotifications === 1;
      this.appNotifications[2].enabled = value.rechargeNotifications === 1;
      this.emailNotifications[0].enabled = value.emailParkingNotifications === 1;
      this.emailNotifications[1].enabled = value.emailUnparkingNotifications === 1;
      this.emailNotifications[2].enabled = value.emailFineNotifications === 1;
      this.emailNotifications[3].enabled = value.emailRechargeNotifications === 1;
      this.feedbackApp = value.feedbackNotifications === 1;
      this.feedbackEmail = value.emailFeedbackNotifications === 1;
    } catch {
      this.loadFailed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    if (this.saving() || this.loading() || this.loadFailed()) return;
    this.saving.set(true);
    try {
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
        feedbackNotifications: Number(this.feedbackApp),
        emailFeedbackNotifications: Number(this.feedbackEmail),
      });
      this.saved.set(result === 'remote');
    } finally {
      this.saving.set(false);
    }
  }

  checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
