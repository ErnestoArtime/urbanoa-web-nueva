import { RuntimeStyleDirective } from '../../../shared/directives/runtime-style.directive';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountCompletionService } from '../../../core/services/account-completion.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile-progress-card',
  standalone: true,
  imports: [RuntimeStyleDirective, RouterLink, TranslatePipe],
  template: `
    <div class="card profile-progress-card">
      <div class="profile-progress-head">
        <span>{{ 'dashboard.profileCompletion.accountConfig' | translate }}</span>
        <button
          type="button"
          class="progress-help"
          [attr.aria-label]="'dashboard.profileCompletion.help' | translate"
          (click)="toggleHelp()"
        >
          i
        </button>
        <strong>{{ realProgress() }}%</strong>
      </div>
      <div class="profile-progress"><span [appRuntimeStyle]="{ width: realProgress() + '%' }"></span></div>
      <p class="card-title">{{ 'dashboard.profileCompletion.title' | translate }}</p>
      <p class="card-subtitle">{{ 'dashboard.profileCompletion.subtitle' | translate }}</p>
      @if (showHelp()) {
        <div class="profile-checklist">
          @for (item of completionItems(); track item.key) {
            <p>
              <span [class.done]="item.done">{{ item.done ? '✓' : '○' }}</span
              >{{ item.label | translate }} ({{ item.action | translate }})
            </p>
          }
        </div>
      }
      <div class="profile-actions mt-1">
        <a routerLink="/app/account/profile" class="btn btn-primary btn-sm">{{
          'dashboard.profileCompletion.reviewProfile' | translate
        }}</a>
        @for (action of pendingActions(); track action.key) {
          <a [routerLink]="action.route" class="btn btn-secondary btn-sm">{{ action.label | translate }}</a>
        }
      </div>
    </div>
  `,
  styleUrl: './profile-progress-card.component.css',
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
    {
      key: 'profile',
      label: 'dashboard.profileCompletion.profileCheck',
      action: 'dashboard.profileCompletion.profileUpdate',
      done: this.profileCompleted(),
    },
    {
      key: 'vehicle',
      label: 'dashboard.profileCompletion.vehicleCheck',
      action: this.vehiclesCompleted() ? 'dashboard.profileCompletion.vehicleUpdate' : 'dashboard.profileCompletion.vehicleAction',
      done: this.vehiclesCompleted(),
    },
    {
      key: 'card',
      label: 'dashboard.profileCompletion.cardCheck',
      action: this.paymentCompleted() ? 'dashboard.profileCompletion.cardUpdate' : 'dashboard.profileCompletion.cardAction',
      done: this.paymentCompleted(),
    },
    {
      key: 'location',
      label: 'dashboard.profileCompletion.locationCheck',
      action: 'dashboard.profileCompletion.locationUpdate',
      done: this.locationCompleted(),
    },
  ]);
  readonly pendingActions = computed(() => {
    const actions: { key: string; label: string; route: string }[] = [];
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
