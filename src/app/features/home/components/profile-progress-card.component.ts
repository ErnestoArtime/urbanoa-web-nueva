import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountCompletionService } from '../../../core/services/account-completion.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile-progress-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="card profile-progress-card">
      <div class="profile-progress-head">
        <span>{{ 'dashboard.profileCompletion.accountConfig' | translate }}</span><strong>{{ realProgress() }}%</strong>
      </div>
      <div class="profile-progress"><span [style.width.%]="realProgress()"></span></div>
      <p class="card-title">{{ 'dashboard.profileCompletion.title' | translate }}</p>
      <p class="card-subtitle">{{ 'dashboard.profileCompletion.subtitle' | translate }}</p>
      <div class="row mt-1">
        <a routerLink="/app/account/profile" class="btn btn-primary btn-sm">{{ 'dashboard.profileCompletion.reviewProfile' | translate }}</a>
        <a routerLink="/onboarding/location" class="btn btn-secondary btn-sm">{{ 'dashboard.profileCompletion.location' | translate }}</a>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-progress-card {
        background: #f7f8f1;
      }
      .profile-progress-head {
        display: flex;
        justify-content: space-between;
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }
      .profile-progress {
        height: 6px;
        margin: 0.45rem 0 0.8rem;
        overflow: hidden;
        border-radius: 999px;
        background: var(--color-border);
      }
      .profile-progress span {
        display: block;
        height: 100%;
        background: var(--color-primary-light);
      }
    `,
  ],
})
export class ProfileProgressCardComponent {
  private readonly accountCompletion = inject(AccountCompletionService);

  readonly progress = input(0);
  readonly completeProfile = output<void>();

  readonly realProgress = this.accountCompletion.percent;
}
