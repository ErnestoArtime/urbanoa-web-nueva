import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_TICKET_ACTIVE } from '../../../shared/mock-data';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-parking-ticket-detail',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <a routerLink="/app/home" class="back-link">{{ 'parking.ticketDetail.back' | translate }}</a>
      <h1 class="page-title">{{ 'parking.ticketDetail.title' | translate }}</h1>
      <div class="card mt-2">
        <p>
          <strong>{{ 'parking.ticketDetail.vehicle' | translate }}</strong> {{ ticket.plate }}
        </p>
        <p class="mt-1">
          <strong>{{ 'parking.ticketDetail.zone' | translate }}</strong> {{ ticket.zone }}
        </p>
        <p class="mt-1">
          <strong>{{ 'parking.ticketDetail.timeRemaining' | translate }}</strong> {{ ticket.timeRemaining }}
        </p>
      </div>
      <div class="timeline mt-2">
        <div class="timeline-item">
          <strong>{{ 'parking.ticketDetail.start' | translate }}</strong
          ><br /><span class="text-muted">14:30</span>
        </div>
        <div class="timeline-item">
          <strong>{{ 'parking.ticketDetail.end' | translate }}</strong
          ><br /><span class="text-muted">{{ ticket.endTime }}</span>
        </div>
      </div>
      <p class="section-title">{{ 'parking.ticketDetail.paymentMethod' | translate }}</p>
      <div class="card">{{ 'parking.ticketDetail.wallet' | translate: { balance: '' + walletService.balance() } }}</div>
      <a
        [routerLink]="['/app/parking/time-steps']"
        [queryParams]="{ plate: ticket.plate, zone: ticket.zone }"
        class="btn btn-primary btn-block mt-2"
        >{{ 'parking.ticketDetail.extend' | translate }}</a
      >
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
  readonly ticket = MOCK_TICKET_ACTIVE;
  readonly walletService = inject(WalletService);
}
