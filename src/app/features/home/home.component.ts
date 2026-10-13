import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { WalletService } from '../../core/services/wallet.service';
import { UserService } from '../../core/services/user.service';
import { OperationsService, type ActiveParking } from '../../core/services/operations.service';
import { ParkingSessionService } from '../../core/services/parking-session.service';
import type { UnparkingQuoteResult } from '../../core/services/parking-api.service';
import { NavigationToCarService } from '../../core/services/navigation-to-car.service';
import { OperationType } from '../../shared/models/operation-type';
import { isAcknowledgedFine } from '../../core/services/unpaid-fines.service';
import { ParkingTicketCardComponent } from '../../shared/components/parking-ticket-card/parking-ticket-card.component';
import { WalletSummaryCardComponent } from './components/wallet-summary-card.component';
import { VehicleSummaryCardComponent } from './components/vehicle-summary-card.component';
import { RecentOperationsCardComponent } from './components/recent-operations-card.component';
import { ProfileProgressCardComponent } from './components/profile-progress-card.component';
import { ResultModalComponent } from '../../shared/components/result-modal/result-modal.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { VehicleService } from '../../core/services/vehicle.service';
import { DashboardApiService } from '../../core/services/dashboard-api.service';
import { ParkingFlowStore } from '../parking/parking-flow.store';
import { TranslationService } from '../../core/services/translation.service';

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
    LoaderComponent,
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
            @if (parkingStatusLoading() && activeParkings().length > 0) {
              <div class="parking-status-progress" role="status" aria-live="polite">
                <span class="sr-only">{{ 'dashboard.loadingActiveParkings' | translate }}</span>
              </div>
            }
            @if (parkingStatusLoading() && activeParkings().length === 0) {
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
                (extendTime)="onExtend($event)"
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
                    (extendTime)="onExtend($event)"
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
            <app-vehicle-summary-card [vehicle]="vehicle()" [unavailable]="vehicleLoadFailed()" />
            <app-wallet-summary-card
              [balance]="walletService.balance()"
              [balanceAvailable]="walletService.balanceAvailable()"
              [balanceError]="!walletService.balanceAvailable() && !!walletService.lastError()"
              [mainCard]="walletService.mainCard"
              [hasCards]="walletService.cards().length > 0"
              (recharge)="onRecharge()"
              (retry)="walletService.load()"
            />
            <app-profile-progress-card />
          </div>
        </div>
      }
      @if (unparked()) {
        <app-result-modal
          type="unpark"
          [title]="'parking.ended' | translate"
          [message]="unparkedRefundAmount() > 0 ? ('dashboard.unparkSuccessDetail' | translate) : undefined"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="dismissUnparked()"
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
          [message]="
            (pendingUnparkAmount() ?? 0) > 0
              ? ('dashboard.unparkConfirmDetail' | translate: { amount: 'EUR' + pendingUnparkAmount()!.toFixed(2) })
              : ('dashboard.unparkNoRefund' | translate)
          "
          [primaryText]="'common.accept' | translate"
          [secondaryText]="'common.cancel' | translate"
          (primaryAction)="confirmUnparkAction()"
          (secondaryAction)="!unparking() && confirmUnpark.set(false)"
          [busy]="unparking()"
        />
      }
      <app-loader [visible]="unparkQuerying()" [message]="'common.loading' | translate" />
    </div>
  `,
  styleUrl: './home.component.css',
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
  private readonly parkingFlowStore = inject(ParkingFlowStore);
  private readonly translations = inject(TranslationService);
  readonly user = this.userService.user;
  readonly fullName = computed(() => `${this.user().name} ${this.user().surname}`);
  readonly activeParkings = this.parkingSessionService.activeParkings;
  readonly unparkError = this.parkingSessionService.unparkError;
  readonly vehicle = this.vehicleService.mainVehicle;
  readonly vehicleLoadFailed = computed(() => this.vehicleService.source?.() === 'error');
  readonly recentOps = computed(() => {
    const list = this.operationsService
      .operations()
      .filter((op) => op.type !== OperationType.UNPAID_FINES || isAcknowledgedFine(op))
      .sort((a, b) => {
        const dateDiff = this.toDateValue(b.date) - this.toDateValue(a.date);
        if (dateDiff !== 0) return dateDiff;
        return (b.operationTime ?? b.startTime ?? b.endTime ?? '').localeCompare(a.operationTime ?? a.startTime ?? a.endTime ?? '');
      });
    return list.slice(0, 3);
  });
  readonly initialLoading = computed(() => this.dashboardApi.source() === 'idle');
  readonly parkingStatusLoading = this.operationsService.activeLoading;
  readonly unparked = signal(false);
  readonly unparkedRefundAmount = signal(0);
  readonly confirmUnpark = signal(false);
  readonly unparking = signal(false);
  readonly unparkQuerying = signal(false);
  readonly pendingUnparkAmount = signal<number | null>(null);
  private pendingUnparkId = '';
  private pendingUnparkQuote: UnparkingQuoteResult | undefined;

  constructor() {
    void this.dashboardApi.load();
  }

  async confirmUnparkFor(parking: ActiveParking): Promise<void> {
    if (this.unparkQuerying()) return;
    this.unparkQuerying.set(true);
    this.unparkError.set(null);
    try {
      this.pendingUnparkId = parking.id;
      const quote = await this.parkingSessionService.quoteUnparking(parking.id);
      if (!quote.success) {
        this.unparkError.set(this.translations.translate('parking.unparking.quoteError'));
        return;
      }
      this.pendingUnparkQuote = quote;
      this.pendingUnparkAmount.set(quote.refundAmount ?? 0);
      this.confirmUnpark.set(true);
    } finally {
      this.unparkQuerying.set(false);
    }
  }

  async confirmUnparkAction(): Promise<void> {
    if (!this.confirmUnpark() || this.unparking()) return;
    this.unparking.set(true);
    try {
      if (await this.parkingSessionService.leaveParking(this.pendingUnparkId, this.pendingUnparkQuote)) {
        this.unparkedRefundAmount.set(this.pendingUnparkAmount() ?? 0);
        this.unparked.set(true);
      }
    } catch (error) {
      this.unparkError.set(error instanceof Error ? error.message : this.translations.translate('dashboard.unparkError'));
    } finally {
      this.confirmUnpark.set(false);
      this.pendingUnparkId = '';
      this.pendingUnparkQuote = undefined;
      this.pendingUnparkAmount.set(null);
      this.unparking.set(false);
    }
  }

  dismissUnparked(): void {
    this.unparked.set(false);
    this.unparkedRefundAmount.set(0);
  }

  onExtend(parking: ActiveParking): void {
    if (parking.extension !== 2) return;
    if (!this.parkingFlowStore.startExtension(parking)) return;
    void this.router.navigate(['/app/parking/time-steps']);
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
