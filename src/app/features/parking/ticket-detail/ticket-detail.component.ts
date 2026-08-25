import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { WalletService } from '../../../core/services/wallet.service';
import { ParkingFlowStore } from '../parking-flow.store';

@Component({
  selector: 'app-parking-ticket-detail',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <a routerLink="/app/home" class="back-link">{{ 'parking.ticketDetail.back' | translate }}</a>
      <h1 class="page-title">{{ 'parking.ticketDetail.title' | translate }}</h1>
      <div class="card mt-2">
        <p>
          <strong>{{ 'parking.ticketDetail.vehicle' | translate }}</strong> {{ ticket().plate }}
        </p>
        <p class="mt-1">
          <strong>{{ 'parking.ticketDetail.zone' | translate }}</strong> {{ ticket().zone }}
        </p>
        <p class="mt-1">
          <strong>{{ 'parking.ticketDetail.timeRemaining' | translate }}</strong> {{ ticket().timeRemaining }}
        </p>
      </div>
      <div class="timeline mt-2">
        <div class="timeline-item">
          <strong>{{ 'parking.ticketDetail.start' | translate }}</strong
          ><br /><span class="text-muted">{{ ticket().startTime }}</span>
        </div>
        <div class="timeline-item">
          <strong>{{ 'parking.ticketDetail.end' | translate }}</strong
          ><br /><span class="text-muted">{{ ticket().endTime }}</span>
        </div>
      </div>
      <p class="section-title">{{ 'parking.ticketDetail.paymentMethod' | translate }}</p>
      <div class="card">{{ 'parking.ticketDetail.wallet' | translate: { balance: '' + walletService.balance() } }}</div>
      <a [routerLink]="['/app/parking/time-steps']" [queryParams]="queryParams()" class="btn btn-primary btn-block mt-2">{{
        'parking.ticketDetail.extend' | translate
      }}</a>
      <a routerLink="/app/operations" class="btn btn-secondary btn-block mt-1">{{ 'parking.ticketDetail.unpark' | translate }}</a>
    </div>
  `,
  styles: [
    `
      .back-link {
        display: inline-block;
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class ParkingTicketDetailComponent {
  private readonly flow = inject(ParkingFlowStore);
  readonly ticket = computed(() => {
    const value = this.flow.vm();
    return {
      plate: value.plate ?? '',
      zone: value.sectorName || value.zoneName || value.street || '',
      timeRemaining: value.duration || value.tariffName || '',
      startTime: '--:--',
      endTime: value.endTime || '--:--',
    };
  });
  readonly queryParams = computed(() => this.flow.toQueryParams());
  readonly walletService = inject(WalletService);
}
