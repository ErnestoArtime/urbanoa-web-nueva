import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { WalletService } from '../../core/services/wallet.service';
import { UserService } from '../../core/services/user.service';
import { OperationsService, type ActiveParking } from '../../core/services/operations.service';
import { ParkingSessionService } from '../../core/services/parking-session.service';
import { NavigationToCarService } from '../../core/services/navigation-to-car.service';
import { OperationType } from '../../shared/models/operation-type';
import { ParkingTicketCardComponent } from '../../shared/components/parking-ticket-card/parking-ticket-card.component';
import { WalletSummaryCardComponent } from './components/wallet-summary-card.component';
import { VehicleSummaryCardComponent } from './components/vehicle-summary-card.component';
import { RecentOperationsCardComponent } from './components/recent-operations-card.component';
import { ProfileProgressCardComponent } from './components/profile-progress-card.component';
import { ResultModalComponent } from '../../shared/components/result-modal/result-modal.component';
import { VehicleService } from '../../core/services/vehicle.service';
import { DashboardApiService } from '../../core/services/dashboard-api.service';

@Component({
  selector: 'app-home',
  imports: [
    TranslatePipe,
    RouterLink,
    ParkingTicketCardComponent,
    WalletSummaryCardComponent,
    VehicleSummaryCardComponent,
    RecentOperationsCardComponent,
    ProfileProgressCardComponent,
    ResultModalComponent,
  ],
  template: `
    <div class="page">
      @if (initialLoading()) {
        <div class="dashboard-skeleton" role="status" aria-live="polite" [attr.aria-label]="'common.loading' | translate">
          <span class="sr-only">{{ 'common.loading' | translate }}</span>
          <div class="dashboard-skeleton-heading">
            <span class="skeleton-shape skeleton-title"></span>
            <span class="skeleton-shape skeleton-subtitle"></span>
          </div>
          <div class="dashboard-grid mt-2">
            <div class="dashboard-col-left">
              <div class="skeleton-shape skeleton-card skeleton-active-ticket"></div>
              <div class="skeleton-card skeleton-recent-card">
                <span class="skeleton-shape skeleton-section-title"></span>
                <span class="skeleton-shape skeleton-row"></span>
                <span class="skeleton-shape skeleton-row"></span>
                <span class="skeleton-shape skeleton-row"></span>
              </div>
            </div>
            <div class="dashboard-col-right">
              <div class="skeleton-card skeleton-summary-card">
                <span class="skeleton-shape skeleton-line-short"></span>
                <span class="skeleton-shape skeleton-line-long"></span>
              </div>
              <div class="skeleton-shape skeleton-card skeleton-wallet-card"></div>
              <div class="skeleton-card skeleton-profile-card">
                <span class="skeleton-shape skeleton-line-long"></span>
                <span class="skeleton-shape skeleton-progress"></span>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <h1 class="page-title">{{ 'dashboard.greeting' | translate: { name: fullName() } }}</h1>
        <p class="page-subtitle">{{ user().email }}</p>

        <div class="dashboard-grid mt-2">
          <div class="dashboard-col-left">
            @if (parkingStatusLoading()) {
              <div
                class="skeleton-shape skeleton-card skeleton-active-ticket"
                role="status"
                [attr.aria-label]="'common.loading' | translate"
              >
                <span class="sr-only">{{ 'common.loading' | translate }}</span>
              </div>
            } @else if (activeParkings().length === 1) {
              <app-parking-ticket-card
                [parking]="activeParkings()[0]"
                (leaveParking)="confirmUnparkFor($event)"
                (extendTime)="onExtend()"
                (goToCar)="onGoToCar($event)"
              />
            } @else if (activeParkings().length > 1) {
              <details class="active-parkings-section" open>
                <summary class="active-parkings-summary">
                  <span class="section-label">{{ 'dashboard.activeParkings' | translate }}</span>
                  <span class="active-parkings-count" aria-hidden="true">{{ activeParkings().length }}</span>
                  <span class="sr-only">{{ 'dashboard.activeParkingsCount' | translate: { count: activeParkings().length } }}</span>
                </summary>
                @for (parking of activeParkings(); track parking.id) {
                  <app-parking-ticket-card
                    [parking]="parking"
                    (leaveParking)="confirmUnparkFor($event)"
                    (extendTime)="onExtend()"
                    (goToCar)="onGoToCar($event)"
                  />
                }
              </details>
            } @else {
              <div class="card">
                <p class="text-muted">{{ 'dashboard.noActiveTicket' | translate }}</p>
                <a routerLink="/app/parking" class="btn btn-primary btn-block mt-2">{{ 'parking.title' | translate }}</a>
              </div>
            }
            <app-recent-operations-card [operations]="recentOps()" (viewAll)="onViewAll()" />
          </div>

          <div class="dashboard-col-right">
            <app-vehicle-summary-card [vehicle]="vehicle()" />
            <app-wallet-summary-card
              [balance]="walletService.balance()"
              [mainCard]="walletService.mainCard"
              [hasCards]="walletService.cards().length > 0"
              (recharge)="onRecharge()"
            />
            <app-profile-progress-card />
          </div>
        </div>
      }
      @if (unparked()) {
        <app-result-modal
          type="unpark"
          [title]="'parking.ended' | translate"
          [message]="'dashboard.unparkSuccessDetail' | translate"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="unparked.set(false)"
        />
      }
      @if (unparkError(); as error) {
        <app-result-modal
          type="error"
          [title]="'dashboard.unparkError' | translate"
          [message]="error"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="unparkError.set(null)"
        />
      }
      @if (confirmUnpark()) {
        <app-result-modal
          type="confirmation"
          [title]="'dashboard.unpark' | translate"
          [message]="'dashboard.unparkConfirmDetail' | translate: { amount: 'EUR3.70' }"
          [primaryText]="'common.accept' | translate"
          [secondaryText]="'common.cancel' | translate"
          (primaryAction)="confirmUnparkAction()"
          (secondaryAction)="confirmUnpark.set(false)"
        />
      }
    </div>
  `,
  styles: [
    `
      .dashboard-grid {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .dashboard-col-left,
      .dashboard-col-right {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .dashboard-skeleton-heading {
        display: grid;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      .skeleton-shape,
      .skeleton-card {
        position: relative;
        display: block;
        overflow: hidden;
        background: #e7ebe2;
      }
      .skeleton-shape::after,
      .skeleton-card::after {
        position: absolute;
        inset: 0;
        content: '';
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
        animation: dashboard-shimmer 1.25s ease-in-out infinite;
      }
      .skeleton-card {
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
      }
      .skeleton-card > .skeleton-shape {
        z-index: 1;
      }
      .skeleton-title {
        width: min(72%, 20rem);
        height: 1.45rem;
        border-radius: var(--radius-sm);
      }
      .skeleton-subtitle {
        width: min(52%, 14rem);
        height: 0.85rem;
        border-radius: var(--radius-sm);
      }
      .skeleton-active-ticket {
        min-height: 11rem;
      }
      .skeleton-recent-card {
        display: grid;
        gap: 0.65rem;
        min-height: 17rem;
        padding: 1rem;
        background: transparent;
      }
      .skeleton-summary-card {
        display: grid;
        gap: 0.65rem;
        min-height: 5.75rem;
        padding: 1rem;
        background: transparent;
      }
      .skeleton-wallet-card {
        min-height: 12rem;
      }
      .skeleton-profile-card {
        display: grid;
        gap: 0.9rem;
        min-height: 7rem;
        padding: 1rem;
        background: transparent;
      }
      .skeleton-section-title,
      .skeleton-line-short,
      .skeleton-line-long,
      .skeleton-row,
      .skeleton-progress {
        border-radius: var(--radius-sm);
      }
      .skeleton-section-title {
        width: 42%;
        height: 0.8rem;
      }
      .skeleton-row {
        width: 100%;
        height: 4rem;
      }
      .skeleton-line-short {
        width: 38%;
        height: 0.8rem;
      }
      .skeleton-line-long {
        width: 72%;
        height: 1rem;
      }
      .skeleton-progress {
        width: 100%;
        height: 0.75rem;
        border-radius: var(--radius-pill);
      }
      @keyframes dashboard-shimmer {
        to {
          transform: translateX(100%);
        }
      }
      .active-parkings-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .active-parkings-summary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-height: 2.75rem;
        padding: 0.35rem 0.15rem;
        color: var(--color-text-muted);
        cursor: pointer;
        list-style: none;
        user-select: none;
      }
      .active-parkings-summary::-webkit-details-marker {
        display: none;
      }
      .active-parkings-summary::after {
        content: '';
        width: 0.55rem;
        height: 0.55rem;
        margin-right: 0.35rem;
        margin-left: auto;
        border-right: 2px solid var(--color-primary);
        border-bottom: 2px solid var(--color-primary);
        transform: rotate(45deg) translateY(-0.15rem);
        transition: transform 180ms ease;
      }
      .active-parkings-section[open] .active-parkings-summary::after {
        transform: rotate(225deg) translateY(-0.15rem);
      }
      .active-parkings-summary:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 3px;
        border-radius: var(--radius-sm);
      }
      .active-parkings-count {
        display: inline-grid;
        min-width: 1.5rem;
        height: 1.5rem;
        place-items: center;
        padding: 0 0.35rem;
        border-radius: 999px;
        background: var(--color-primary);
        color: #fff;
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
      }
      .section-label {
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin: 0.25rem 0 0.1rem;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      @media (min-width: 960px) {
        :host > .page {
          max-width: 1420px;
          margin: 0 auto;
          padding: 1.5rem 1rem 1.5rem;
        }
        .page-title,
        .page-subtitle {
          display: none;
        }
        .dashboard-skeleton-heading {
          display: none;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: minmax(300px, 0.82fr) minmax(410px, 1.18fr);
          align-items: start;
          gap: 0.5rem;
        }
      }
    `,
  ],
})
export class HomeComponent {
  private readonly router = inject(Router);
  readonly walletService = inject(WalletService);
  private readonly operationsService = inject(OperationsService);
  private readonly parkingSessionService = inject(ParkingSessionService);
  private readonly userService = inject(UserService);
  private readonly navigationToCar = inject(NavigationToCarService);
  private readonly vehicleService = inject(VehicleService);
  private readonly dashboardApi = inject(DashboardApiService);
  readonly user = this.userService.user;
  readonly fullName = computed(() => `${this.user().name} ${this.user().surname}`);
  readonly activeParkings = this.parkingSessionService.activeParkings;
  readonly unparkError = this.parkingSessionService.unparkError;
  readonly vehicle = this.vehicleService.mainVehicle;
  readonly recentOps = computed(() => {
    const list = this.operationsService
      .operations()
      .filter((op) => op.type !== OperationType.UNPAID_FINES)
      .sort((a, b) => this.toDateValue(b.date) - this.toDateValue(a.date));
    return list.slice(0, 3);
  });
  readonly initialLoading = computed(() => this.dashboardApi.source() === 'idle');
  readonly parkingStatusLoading = computed(() => this.operationsService.activeSource() === 'idle');
  readonly unparked = signal(false);
  readonly confirmUnpark = signal(false);
  private pendingUnparkId = '';

  constructor() {
    void this.dashboardApi.load();
  }

  confirmUnparkFor(parking: ActiveParking): void {
    this.pendingUnparkId = parking.id;
    this.confirmUnpark.set(true);
  }

  async confirmUnparkAction(): Promise<void> {
    this.confirmUnpark.set(false);
    if (await this.parkingSessionService.leaveParking(this.pendingUnparkId)) {
      this.pendingUnparkId = '';
      this.unparked.set(true);
    }
  }

  onExtend(): void {
    this.router.navigate(['/app/parking/time-steps']);
  }

  onRecharge(): void {
    this.router.navigate(['/app/account/payment-methods/recharge']);
  }

  onGoToCar(parking: ActiveParking): void {
    this.navigationToCar.open({
      latitude: parking.latitude,
      longitude: parking.longitude,
      label: parking.plate,
    });
  }

  onViewAll(): void {
    this.router.navigate(['/app/operations']);
  }

  private toDateValue(d: string): number {
    if (d.includes('/')) {
      const [day, month, year] = d.split('/').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
    }
    const [year, month, day] = d.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
  }
}
