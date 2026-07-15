import { Component, computed, inject, input, output, signal } from '@angular/core';
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
        <span>{{ 'dashboard.profileCompletion.accountConfig' | translate }}</span>
        <button type="button" class="progress-help" [attr.aria-label]="'dashboard.profileCompletion.help' | translate" (click)="toggleHelp()">i</button>
        <strong>{{ realProgress() }}%</strong>
      </div>
      <div class="profile-progress"><span [style.width.%]="realProgress()"></span></div>
      <p class="card-title">{{ 'dashboard.profileCompletion.title' | translate }}</p>
      <p class="card-subtitle">{{ 'dashboard.profileCompletion.subtitle' | translate }}</p>
      @if (showHelp()) {
        <div class="profile-checklist">
          @for (item of completionItems(); track item.key) {
            <p><span [class.done]="item.done">{{ item.done ? '✓' : '○' }}</span>{{ item.label | translate }} ({{ item.action | translate }})</p>
          }
        </div>
      }
      <div class="profile-actions mt-1">
        <a routerLink="/app/account/profile" class="btn btn-primary btn-sm">{{ 'dashboard.profileCompletion.reviewProfile' | translate }}</a>
        @for (action of pendingActions(); track action.key) {
          <a [routerLink]="action.route" class="btn btn-secondary btn-sm">{{ action.label | translate }}</a>
        }
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
        align-items: center;
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
      .progress-help {
        display: inline-grid;
        place-items: center;
        width: 1.15rem;
        height: 1.15rem;
        margin-left: auto;
        margin-right: 0.4rem;
        border: 1px solid var(--color-primary);
        border-radius: 50%;
        background: transparent;
        color: var(--color-primary);
        font-size: var(--text-2xs);
        font-weight: var(--font-extra);
        cursor: pointer;
      }
      .profile-checklist {
        display: grid;
        gap: 0.25rem;
        padding: 0.55rem 0.7rem;
        border-radius: var(--radius-sm);
        background: var(--color-background);
        font-size: var(--text-xs);
      }
      .profile-checklist p { display: flex; align-items: center; gap: 0.45rem; margin: 0; }
      .profile-checklist span { color: var(--color-error); font-weight: var(--font-extra); }
      .profile-checklist span.done { color: var(--color-success); }
      .profile-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
        align-items: center;
      }
    `,
  ],
})
export class ProfileProgressCardComponent {
  private readonly accountCompletion = inject(AccountCompletionService);

  readonly progress = input(0);
  readonly completeProfile = output<void>();

  readonly realProgress = this.accountCompletion.percent;
  readonly showHelp = signal(false);
  readonly profileCompleted = this.accountCompletion.profileCompleted;
  readonly vehiclesCompleted = this.accountCompletion.vehicleCompleted;
  readonly paymentCompleted = this.accountCompletion.paymentCompleted;
  readonly locationCompleted = this.accountCompletion.locationCompleted;
  readonly completionItems = computed(() => [
    { key: 'profile', label: 'dashboard.profileCompletion.profileCheck', action: 'dashboard.profileCompletion.profileUpdate', done: this.profileCompleted() },
    { key: 'vehicle', label: 'dashboard.profileCompletion.vehicleCheck', action: this.vehiclesCompleted() ? 'dashboard.profileCompletion.vehicleUpdate' : 'dashboard.profileCompletion.vehicleAction', done: this.vehiclesCompleted() },
    { key: 'card', label: 'dashboard.profileCompletion.cardCheck', action: this.paymentCompleted() ? 'dashboard.profileCompletion.cardUpdate' : 'dashboard.profileCompletion.cardAction', done: this.paymentCompleted() },
    { key: 'location', label: 'dashboard.profileCompletion.locationCheck', action: 'dashboard.profileCompletion.locationUpdate', done: this.locationCompleted() },
  ]);
  readonly pendingActions = computed(() => {
    const actions: Array<{ key: string; label: string; route: string }> = [];
    if (!this.vehiclesCompleted()) {
      actions.push({ key: 'vehicle', label: 'dashboard.profileCompletion.vehicleAction', route: '/app/account/vehicles/add' });
    }
    if (!this.paymentCompleted()) {
      actions.push({ key: 'card', label: 'dashboard.profileCompletion.cardAction', route: '/app/account/payment-methods/add' });
    }
    actions.push({ key: 'location', label: 'dashboard.profileCompletion.location', route: '/onboarding/location' });
    return actions;
  });

  toggleHelp(): void {
    this.showHelp.update((value) => !value);
  }
}
