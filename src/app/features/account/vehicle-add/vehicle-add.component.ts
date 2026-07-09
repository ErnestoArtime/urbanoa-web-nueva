import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { VehicleService } from '../../../core/services/vehicle.service';

@Component({
  selector: 'app-vehicle-add',
  imports: [TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header backRoute="/app/account/vehicles" [title]="'account.vehicleAdd.title' | translate" [backDesktop]="true" />
      <div class="card">
        <div class="form-group">
          <label>{{ 'account.vehicleAdd.plate' | translate }} <span class="text-error">*</span></label
          ><input
            class="form-input"
            [class.invalid]="plateError()"
            [value]="plate()"
            (input)="setPlate($event)"
            [placeholder]="'account.vehicleAdd.plate' | translate"
          />
          @if (plateError()) {
            <p class="form-error">{{ 'account.vehicleAdd.plateRequired' | translate }}</p>
          }
        </div>
        <label class="switch-row"
          ><span>{{ 'account.vehicleAdd.foreignPlate' | translate }}</span
          ><input type="checkbox" [checked]="foreignPlate()" (change)="foreignPlate.set(checked($event))" /><span class="switch"></span
        ></label>
        <label class="switch-row"
          ><span>{{ 'account.vehicleAdd.favorite' | translate }}</span
          ><input type="checkbox" [checked]="favorite()" (change)="favorite.set(checked($event))" /><span class="switch"></span
        ></label>
        <button type="button" class="btn btn-primary btn-block mt-2" (click)="save()">{{ 'account.vehicleAdd.save' | translate }}</button>
      </div>
      @if (saved()) {
        <app-result-modal
          type="success"
          [title]="'account.vehicleAdd.successTitle' | translate"
          [message]="'account.vehicleAdd.successDetail' | translate"
          [primaryText]="'account.vehicle.backToVehicles' | translate"
          (primaryAction)="goBack()"
        />
      }
    </div>
  `,
  styles: [
    `
      .switch-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.65rem 0;
        cursor: pointer;
      }
      .form-input.invalid {
        border-color: var(--color-error);
      }
      .form-error {
        margin-top: 0.35rem;
        color: var(--color-error);
        font-size: var(--text-xs);
      }
      .switch {
        position: relative;
        width: 44px;
        height: 24px;
        border-radius: 99px;
        background: var(--color-border);
        transition: background 0.2s;
        flex-shrink: 0;
      }
      .switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #fff;
        transition: left 0.2s;
      }
      input:checked + .switch {
        background: var(--color-primary);
      }
      input:checked + .switch::after {
        left: 22px;
      }
    `,
  ],
})
export class VehicleAddComponent {
  private readonly vehicleService = inject(VehicleService);
  private readonly router = inject(Router);
  readonly plate = signal('');
  readonly foreignPlate = signal(false);
  readonly favorite = signal(false);
  readonly plateError = signal(false);
  readonly saved = signal(false);

  setPlate(event: Event): void {
    this.plate.set((event.target as HTMLInputElement).value.toUpperCase());
    if (this.plate().trim()) this.plateError.set(false);
  }

  checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  save(): void {
    const plate = this.plate().trim();
    if (!plate) {
      this.plateError.set(true);
      return;
    }
    this.vehicleService.add({ plate, isDefault: this.favorite(), label: this.foreignPlate() ? 'Matrícula extranjera' : undefined });
    this.saved.set(true);
  }

  goBack(): void {
    void this.router.navigate(['/app/account/vehicles']);
  }
}
