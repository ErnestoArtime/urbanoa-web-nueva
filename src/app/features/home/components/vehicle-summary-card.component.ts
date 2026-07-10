import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import type { Vehicle } from '../../../shared/mock-data';

@Component({
  selector: 'app-vehicle-summary-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AppIconComponent],
  template: `
    <div class="card compact-card vehicle-summary-card">
      <app-icon name="vehicle" class="vehicle-summary-icon" [stroke]="false" />
      <div>
        <p class="vehicle-summary-label">{{ 'dashboard.vehicle' | translate }}</p>
        <p class="vehicle-plate">{{ vehicle().plate }}</p>
      </div>
      <a routerLink="/app/account/vehicles" class="btn btn-secondary btn-sm manage-vehicles">{{ 'account.menu.vehicles' | translate }}</a>
    </div>
  `,
  styles: [
    `
      .compact-card {
        min-height: 76px;
      }
      .vehicle-summary-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-height: 74px;
      }
      .vehicle-summary-icon {
        width: 20px;
        height: 20px;
        color: var(--color-primary);
        flex-shrink: 0;
      }
      .vehicle-summary-icon svg {
        width: 100%;
        height: 100%;
        fill: currentColor;
      }
      .vehicle-summary-label {
        color: #465149;
        font-size: var(--text-xs);
        font-weight: var(--font-bold);
      }
      .vehicle-plate {
        font-size: var(--text-lg);
        font-weight: var(--font-bold);
        letter-spacing: 0.03em;
        color: #1f2b27;
        line-height: var(--line-tight);
        margin-top: 0.15rem;
      }
      .manage-vehicles {
        min-height: 30px;
        margin-left: auto;
        padding: 0.34rem 0.72rem;
        font-size: var(--text-xs);
        line-height: 1;
        white-space: nowrap;
      }
    `,
  ],
})
export class VehicleSummaryCardComponent {
  readonly vehicle = input.required<Vehicle>();
}
