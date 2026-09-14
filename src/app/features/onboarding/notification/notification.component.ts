import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { NotificationsService } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-onboarding-notification',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <p class="page-subtitle">{{ 'onboarding.notification.subtitle' | translate }}</p>
      <p class="text-muted">{{ 'onboarding.notification.webNotice' | translate }}</p>
      @if (failed()) { <p class="form-error" role="alert">{{ 'onboarding.notification.saveError' | translate }}</p> }
      <button type="button" class="btn btn-primary btn-block mt-2" [disabled]="saving()" (click)="activate()">
        {{ 'onboarding.notification.savePreferences' | translate }}
      </button>
      <a routerLink="/app" class="btn btn-ghost btn-block mt-1">{{ 'common.cancel' | translate }}</a>
    </div>
  `,
})
export class OnboardingNotificationComponent {
  readonly saving = signal(false);
  readonly failed = signal(false);
  private readonly notifications = inject(NotificationsService);
  private readonly router = inject(Router);

  async activate(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.failed.set(false);
    try {
      const result = await this.notifications.save(this.notifications.preferences());
      if (result === 'remote') await this.router.navigate(['/onboarding/ready']);
      else this.failed.set(true);
    } catch {
      this.failed.set(true);
    } finally {
      this.saving.set(false);
    }
  }
}
