import { ApiErrorPipe } from '../../../shared/pipes/api-error.pipe';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import type { Vehicle } from '../../../shared/models/vehicle';

@Component({
  selector: 'app-vehicle-summary-card',
  standalone: true,
  imports: [ApiErrorPipe, RouterLink, TranslatePipe, AppIconComponent],
  template: `
    <div class="card compact-card vehicle-summary-card">
      <app-icon name="vehicle" class="vehicle-summary-icon" [stroke]="false" />
      @if (vehicle(); as currentVehicle) {
        <div>
          <p class="vehicle-summary-label">{{ 'dashboard.vehicle' | translate }}</p>
          <p class="vehicle-plate">{{ currentVehicle.plate }}</p>
        </div>
      } @else if (unavailable()) {
        <div role="alert">
          <p class="vehicle-summary-label">{{ responseError() | apiError: 'errors.server' }}</p>
        </div>
      } @else {
        <div>
          <p class="vehicle-summary-label">{{ 'dashboard.vehicleEmptyTitle' | translate }}</p>
          <p class="vehicle-empty-detail">{{ 'dashboard.vehicleEmptyDetail' | translate }}</p>
        </div>
      }
      <a routerLink="/app/account/vehicles" class="btn btn-secondary btn-sm manage-vehicles">{{ 'account.menu.vehicles' | translate }}</a>
    </div>
  `,
  styleUrl: './vehicle-summary-card.component.css',
})
export class VehicleSummaryCardComponent {
  readonly vehicle = input<Vehicle | null>(null);
  readonly unavailable = input(false);
  readonly responseError = input<unknown>(null);
}
