import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import type { Vehicle } from '../../../shared/mock-data';

@Component({
  selector: 'app-vehicle-summary-card',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <div class="card compact-card vehicle-summary-card">
      <app-icon name="vehicle" class="vehicle-summary-icon" />
      <div>
        <p class="vehicle-summary-label">Vehículo principal</p>
        <p class="vehicle-plate">{{ vehicle().plate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border-radius: 12px;
      border: 1px solid #d4d9cd;
      box-shadow: 0 1px 0 rgba(28, 44, 39, 0.04), 0 3px 8px rgba(28, 44, 39, 0.07);
      background: #f8f9f2;
      padding: 0.8rem 0.9rem;
    }
    .compact-card { min-height: 76px; }
    .vehicle-summary-card {
      display:flex;
      align-items:center;
      gap:.75rem;
      min-height:74px;
    }
    .vehicle-summary-icon {
      width:20px;
      height:20px;
      color:var(--color-primary);
      flex-shrink:0;
    }
    .vehicle-summary-icon svg { width:100%; height:100%; fill:currentColor; }
    .vehicle-summary-label { color:#465149; font-size: var(--text-xs); font-weight: var(--font-bold); }
    .vehicle-plate {
      font-size: var(--text-lg);
      font-weight: var(--font-bold);
      letter-spacing: 0.03em;
      color: #1f2b27;
      line-height: var(--line-tight);
      margin-top: 0.15rem;
    }
  `],
})
export class VehicleSummaryCardComponent {
  readonly vehicle = input.required<Vehicle>();
  readonly manageVehicles = output<void>();
}
