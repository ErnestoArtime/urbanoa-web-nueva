import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { WalletService } from '../../core/services/wallet.service';
import { UserService } from '../../core/services/user.service';
import { MOCK_VEHICLE_PRINCIPAL } from '../../shared/mock-data';
import { OperationsService } from '../../core/services/operations.service';
import { NavigationToCarService } from '../../core/services/navigation-to-car.service';
import { OperationType } from '../../shared/models/operation-type';
import type { TicketActive } from '../../shared/mock-data';
import { ActiveTicketCardComponent } from './components/active-ticket-card.component';
import { WalletSummaryCardComponent } from './components/wallet-summary-card.component';
import { VehicleSummaryCardComponent } from './components/vehicle-summary-card.component';
import { RecentOperationsCardComponent } from './components/recent-operations-card.component';
import { ProfileProgressCardComponent } from './components/profile-progress-card.component';

@Component({
  selector: 'app-home',
  imports: [
    TranslatePipe,
    ActiveTicketCardComponent,
    WalletSummaryCardComponent,
    VehicleSummaryCardComponent,
    RecentOperationsCardComponent,
    ProfileProgressCardComponent,
  ],
  template: `
    <div class="page">
      <h1 class="page-title">{{ 'dashboard.greeting' | translate: { name: fullName() } }}</h1>
      <p class="page-subtitle">{{ user().email }}</p>

      <div class="dashboard-grid mt-2">
        <div class="dashboard-col-left">
          <app-active-ticket-card [ticket]="ticket()" (unpark)="unparkFromDashboard()" (extend)="onExtend()" (goToCar)="onGoToCar($event)" />
          <app-recent-operations-card [operations]="recentOps()" (viewAll)="onViewAll()" />
        </div>

        <div class="dashboard-col-right">
          <app-vehicle-summary-card [vehicle]="vehicle" />
          <app-wallet-summary-card [balance]="walletService.balance()" [mainCard]="walletService.mainCard" (recharge)="onRecharge()" />
          @if (showProfileCard()) {
            <app-profile-progress-card [progress]="75" />
          }
        </div>
      </div>
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
  private readonly userService = inject(UserService);
  private readonly navigationToCar = inject(NavigationToCarService);
  readonly user = this.userService.user;
  readonly fullName = computed(() => `${this.user().name} ${this.user().surname}`);
  readonly ticket = computed(() => this.operationsService.activeOperation());
  readonly vehicle = MOCK_VEHICLE_PRINCIPAL;
  readonly recentOps = computed(() => {
    const list = this.operationsService
      .operations()
      .filter((op) => op.type !== OperationType.UNPAID_FINES)
      .sort((a, b) => this.toDateValue(b.date) - this.toDateValue(a.date));
    return list.slice(0, 3);
  });
  readonly showProfileCard = signal(true);

  unparkFromDashboard(): void {
    this.operationsService.unparkActiveOperation();
  }

  onExtend(): void {
    this.router.navigate(['/app/parking/time-steps']);
  }

  onRecharge(): void {
    this.router.navigate(['/app/account/recharge']);
  }

  onGoToCar(ticket: TicketActive): void {
    const ok = this.navigationToCar.open({
      latitude: ticket.latitude,
      longitude: ticket.longitude,
      label: ticket.plate,
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
