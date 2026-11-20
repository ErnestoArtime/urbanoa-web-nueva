import { TranslationService } from '../../../core/services/translation.service';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { apiErrorMessage } from '../../../core/http/api-error-key';
import { AuthService } from '../../../core/services/auth.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-account-delete-account',
  imports: [TranslatePipe, DetailPanelHeaderComponent, LoaderComponent, ResultModalComponent],
  template: `
    <app-loader [visible]="submitting()" [message]="'common.loading' | translate" />
    <div class="page account-static-page">
      <app-detail-panel-header [title]="'account.deleteAccount.title' | translate" backRoute="/app/account" />
    </div>
    @if (errorMessage(); as message) {
      <app-result-modal
        type="error"
        [title]="'account.deleteAccount.title' | translate"
        [message]="message"
        [primaryText]="'common.accept' | translate"
        (primaryAction)="errorMessage.set('')"
      />
    } @else if (!submitting()) {
      <app-result-modal
        type="confirmation"
        [title]="'account.deleteAccount.title' | translate"
        [message]="'account.deleteAccount.warning' | translate"
        [primaryText]="'common.accept' | translate"
        [secondaryText]="'common.cancel' | translate"
        (primaryAction)="confirm()"
        (secondaryAction)="cancel()"
      />
    }
  `,
})
export class AccountDeleteAccountComponent {
  private readonly errorTranslation = inject(TranslationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  async confirm(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.errorMessage.set('');
    try {
      await this.authService.cancelAccount();
      await this.router.navigateByUrl('/auth/login');
    } catch (error) {
      this.errorMessage.set(apiErrorMessage(error, this.errorTranslation));
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    void this.router.navigateByUrl('/app/account');
  }
}
