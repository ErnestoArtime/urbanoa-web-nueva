import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideCheck, LucideMessageCircle } from '@lucide/angular';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-support-success',
  imports: [LucideCheck, LucideMessageCircle, TranslatePipe],
  template: `
    <div class="page account-static-page support-success-page">
      <div class="success-mark" aria-hidden="true"><svg lucideCheck size="32" strokeWidth="2.5"></svg></div>
      <p class="success-kicker">{{ 'account.supportSuccess.received' | translate }}</p>
      <h1>{{ 'account.supportSuccess.title' | translate }}</h1>
      <p class="success-detail">{{ 'account.supportSuccess.detail' | translate }}</p>
      <div class="success-reference">
        <svg lucideMessageCircle size="19"></svg>
        <span>{{ 'account.supportSuccess.threadCreated' | translate }}</span>
      </div>
      <button class="btn btn-primary" (click)="goBack()">{{ 'account.supportSuccess.button' | translate }}</button>
    </div>
  `,
  styleUrl: './support-success.component.css',
})
export class AccountSupportSuccessComponent {
  private readonly router = inject(Router);

  goBack(): void {
    void this.router.navigate(['/app/account/support']);
  }
}
