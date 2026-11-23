import { ApiErrorPipe } from '../../../shared/pipes/api-error.pipe';
import { afterNextRender, Component, effect, ElementRef, inject, Injector, input, output, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { VehicleService } from '../../../core/services/vehicle.service';
import { FOREIGN_PLATE_MAX_LENGTH, isValidPlate, normalizePlate } from '../../../shared/utils/plate-validation';
import { OperationsService } from '../../../core/services/operations.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-vehicle-add',
  imports: [ApiErrorPipe, TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent, LoaderComponent],
  template: `
    <app-loader [visible]="saving()" [message]="'common.loading' | translate" />
    <div class="page account-static-page account-form-page">
      @if (embedded()) {
        <h2 class="detail-title">{{ 'account.vehicleAdd.title' | translate }}</h2>
      } @else {
        <app-detail-panel-header backRoute="/app/account/vehicles" [title]="'account.vehicleAdd.title' | translate" [backDesktop]="true" />
      }
      <div class="card">
        <div class="form-group">
          <input
            #plateInput
            class="form-input"
            [disabled]="!enabled()"
            [attr.aria-label]="'account.vehicleAdd.plate' | translate"
            aria-required="true"
            [class.invalid]="plateError() || plateInvalid() || plateDuplicate()"
            [value]="plate()"
            (input)="setPlate($event)"
            [placeholder]="'account.vehicleAdd.plate' | translate"
            [attr.maxlength]="foreignPlate() ? FOREIGN_PLATE_MAX_LENGTH : null"
          />
          @if (plateError()) {
            <p class="form-error">{{ 'account.vehicleAdd.plateRequired' | translate }}</p>
          }
          @if (plateInvalid()) {
            <p class="form-error">{{ 'account.vehicleAdd.plateInvalid' | translate }}</p>
          }
          @if (plateDuplicate()) {
            <p class="form-error">{{ 'account.vehicleAdd.plateDuplicate' | translate }}</p>
          }
        </div>
        <label class="switch-row"
          ><span>{{ 'account.vehicleAdd.foreignPlate' | translate }}</span
          ><input type="checkbox" [disabled]="!enabled()" [checked]="foreignPlate()" (change)="foreignPlate.set(checked($event))" /><span
            class="switch"
          ></span
        ></label>
        <button type="button" class="btn btn-primary btn-block mt-2" [disabled]="saving() || !enabled()" (click)="save()">
          {{ 'account.vehicleAdd.save' | translate }}
        </button>
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
      @if (addFailed()) {
        <app-result-modal
          type="error"
          [title]="'account.vehicleAdd.addErrorTitle' | translate"
          [message]="addErrorMessage() | apiError: 'account.vehicleAdd.addErrorDetail'"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="addFailed.set(false)"
        />
      }
    </div>
  `,
  styleUrl: './vehicle-add.component.css',
})
export class VehicleAddComponent {
  private readonly vehicleService = inject(VehicleService);
  private readonly operationsService = inject(OperationsService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  readonly embedded = input(false);
  readonly enabled = input(true);
  readonly focusRequest = input(0);
  readonly done = output<void>();
  private readonly plateInput = viewChild<ElementRef<HTMLInputElement>>('plateInput');
  readonly plate = signal('');
  readonly foreignPlate = signal(false);
  readonly plateError = signal(false);
  readonly plateInvalid = signal(false);
  readonly plateDuplicate = signal(false);
  readonly saved = signal(false);
  readonly saving = signal(false);
  readonly addFailed = signal(false);
  readonly addErrorMessage = signal<unknown>(null);
  readonly FOREIGN_PLATE_MAX_LENGTH = FOREIGN_PLATE_MAX_LENGTH;

  constructor() {
    effect(() => {
      if (this.focusRequest() > 0 && this.enabled()) {
        afterNextRender(() => this.plateInput()?.nativeElement.focus(), { injector: this.injector });
      }
    });
  }

  setPlate(event: Event): void {
    this.plate.set((event.target as HTMLInputElement).value.toUpperCase());
    if (this.plate().trim()) {
      this.plateError.set(false);
      this.plateInvalid.set(false);
      this.plateDuplicate.set(false);
    }
  }

  checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    const plate = normalizePlate(this.plate());
    if (!plate) {
      this.plateError.set(true);
      return;
    }
    if (!isValidPlate(plate, this.foreignPlate())) {
      this.plateInvalid.set(true);
      return;
    }
    if (this.vehicleService.hasPlate(plate)) {
      this.plateDuplicate.set(true);
      return;
    }
    this.saving.set(true);
    try {
      const mutation = await this.vehicleService.add({
        plate,
        isDefault: false,
        isForeign: this.foreignPlate(),
        label: this.foreignPlate() ? 'account.vehicle.foreignPlate' : undefined,
      });
      if (mutation.success) {
        await this.operationsService.load();
        this.saved.set(true);
      } else {
        this.addErrorMessage.set(mutation.error);
        this.addFailed.set(true);
      }
    } catch (error) {
      this.addErrorMessage.set(error);
      this.addFailed.set(true);
    } finally {
      this.saving.set(false);
    }
  }

  goBack(): void {
    if (this.embedded()) {
      this.saved.set(false);
      this.plate.set('');
      this.foreignPlate.set(false);
      this.done.emit();
      return;
    }
    void this.router.navigate(['/app/account/vehicles']);
  }
}
