import { Component, inject, input, output } from '@angular/core';
import { LucideCarFront, LucidePencil } from '@lucide/angular';
import type { Vehicle } from '../../models/vehicle';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [TranslatePipe, LucideCarFront, LucidePencil],
  template: `
    <article class="vehicle-card card" [class.parked]="parked()">
      <span class="vehicle-icon"><svg lucideCarFront size="22" strokeWidth="2.3"></svg></span>
      <div class="vehicle-body">
        <strong>{{ vehicle().plate }}</strong>
        <span>{{ subtitle() }}</span>
      </div>
      <button type="button" class="vehicle-edit" (click)="edit.emit(vehicle())" [attr.aria-label]="'common.edit' | translate">
        <svg lucidePencil size="18" strokeWidth="2.2"></svg>
      </button>
    </article>
  `,
  styleUrl: './vehicle-card.component.css',
})
export class VehicleCardComponent {
  readonly vehicle = input.required<Vehicle>();
  readonly parked = input(false);
  readonly edit = output<Vehicle>();
  private readonly translation = inject(TranslationService);

  subtitle(): string {
    if (this.parked()) return this.translation.translate('account.vehicle.alreadyParked');
    if (this.vehicle().isDefault) return this.translation.translate('dashboard.vehicle');
    return this.translation.translateLabel(this.vehicle().label);
  }
}
