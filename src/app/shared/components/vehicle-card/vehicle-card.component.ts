import { Component, input, output } from '@angular/core';
import { LucideCarFront, LucidePencil } from '@lucide/angular';
import type { Vehicle } from '../../mock-data';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [TranslatePipe, LucideCarFront, LucidePencil],
  template: `
    <article class="vehicle-card card" [class.parked]="parked()">
      <span class="vehicle-icon"><svg lucideCarFront size="22" strokeWidth="2.3"></svg></span>
      <div class="vehicle-body">
        <strong>{{ vehicle().plate }}</strong>
        <span>{{ subtitleKey() | translate }}</span>
      </div>
      <button type="button" class="vehicle-edit" (click)="edit.emit(vehicle())" [attr.aria-label]="'common.edit' | translate">
        <svg lucidePencil size="18" strokeWidth="2.2"></svg>
      </button>
    </article>
  `,
  styles: [
    `
      .vehicle-card {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .vehicle-card.parked {
        border-color: var(--color-warning);
      }
      .vehicle-icon {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        flex: none;
        border-radius: 50%;
        background: var(--color-accent-soft);
        color: var(--color-primary-dark);
      }
      .vehicle-body {
        display: flex;
        min-width: 0;
        flex: 1;
        flex-direction: column;
      }
      .vehicle-body strong {
        font-size: var(--text-base);
        letter-spacing: 0.04em;
      }
      .vehicle-body span {
        overflow: hidden;
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .vehicle-edit {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--color-primary);
        cursor: pointer;
      }
      .vehicle-edit:hover {
        background: var(--color-active);
      }
    `,
  ],
})
export class VehicleCardComponent {
  readonly vehicle = input.required<Vehicle>();
  readonly parked = input(false);
  readonly edit = output<Vehicle>();

  subtitleKey(): string {
    if (this.parked()) return 'account.vehicle.alreadyParked';
    if (this.vehicle().isDefault) return 'dashboard.vehicle';
    return this.vehicle().label ? this.vehicle().label! : 'account.vehicle.available';
  }
}
