import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-support-success',
  imports: [TranslatePipe],
  template: `
    <div class="page account-static-page text-center">
      <h1 class="page-title">{{ 'account.supportSuccess.title' | translate }}</h1>
      <p>{{ 'account.supportSuccess.detail' | translate }}</p>
      <button class="btn btn-primary btn-block mt-2" (click)="goBack()">{{ 'account.supportSuccess.button' | translate }}</button>
    </div>
  `,
  styles: [':host{display:block}'],
})
export class AccountSupportSuccessComponent {
  private readonly router = inject(Router);
  goBack(): void {
    void this.router.navigate(['/app/account']);
  }
}
