import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';

@Component({
  selector: 'app-vehicle-edit',
  imports: [TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header backRoute="/app/account/vehicles" [title]="'account.vehicleEdit.title' | translate" [backDesktop]="true" />
      <div class="card">
        <div class="form-group">
          <label>{{ 'account.vehicleEdit.plate' | translate }}</label
          ><input class="form-input" [class.invalid]="plateError()" [value]="plate()" (input)="setPlate($event)" />
          @if (plateError()) {
            <p class="form-error">{{ 'account.vehicleAdd.plateRequired' | translate }}</p>
          }
        </div>
        <label class="switch-row"
          ><span>{{ 'account.vehicleEdit.favorite' | translate }}</span
          ><input type="checkbox" [checked]="favorite()" (change)="favorite.set(checked($event))" /><span class="switch"></span
        ></label>
        <button type="button" class="btn btn-primary btn-block mt-2" [disabled]="saving()" (click)="save()">
          {{ 'account.vehicleEdit.save' | translate }}
        </button>
        <button type="button" class="btn btn-danger btn-block mt-1" [disabled]="saving()" (click)="remove()">
          {{ 'account.vehicleEdit.delete' | translate }}
        </button>
      </div>
      @if (result(); as state) {
        <app-result-modal
          type="success"
          [title]="(state === 'saved' ? 'account.vehicleEdit.savedTitle' : 'account.vehicleEdit.deletedTitle') | translate"
          [message]="(state === 'saved' ? 'account.vehicleEdit.savedDetail' : 'account.vehicleEdit.deletedDetail') | translate"
          [primaryText]="'account.vehicle.backToVehicles' | translate"
          (primaryAction)="goBack()"
        />
      }
      @if (confirmDelete()) {
        <app-result-modal
          type="delete"
          [title]="'account.vehicleEdit.confirmDeleteTitle' | translate"
          [message]="'account.vehicleEdit.confirmDeleteMessage' | translate"
          [primaryText]="'account.vehicleEdit.delete' | translate"
          [secondaryText]="'common.cancel' | translate"
          (primaryAction)="confirmRemove()"
          (secondaryAction)="confirmDelete.set(false)"
        />
      }
      @if (blockedDelete()) {
        <app-result-modal
          type="warning"
          [title]="'account.vehicleEdit.activeParkingTitle' | translate"
          [message]="'account.vehicleEdit.activeParkingMessage' | translate"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="blockedDelete.set(false)"
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
export class VehicleEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vehicleService = inject(VehicleService);
  private readonly parkingSessionService = inject(ParkingSessionService);
  private readonly paramMap = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  readonly id = computed(() => this.paramMap().get('id') ?? '');
  private readonly vehicle = computed(() => this.vehicleService.getById(this.id()));
  readonly plate = signal('');
  readonly favorite = signal(false);
  readonly plateError = signal(false);
  readonly result = signal<'saved' | 'deleted' | null>(null);
  readonly confirmDelete = signal(false);
  readonly blockedDelete = signal(false);
  readonly saving = signal(false);

  constructor() {
    effect(() => {
      const vehicle = this.vehicle();
      this.plate.set(vehicle?.plate ?? '');
      this.favorite.set(vehicle?.isDefault ?? false);
      this.plateError.set(false);
      this.result.set(null);
      this.confirmDelete.set(false);
      this.blockedDelete.set(false);
    });
  }

  async ngOnInit(): Promise<void> {
    const vehicle = this.vehicle();
    if (vehicle) await this.parkingSessionService.loadParkingStatuses([vehicle]);
  }

  setPlate(event: Event): void {
    this.plate.set((event.target as HTMLInputElement).value.toUpperCase());
    if (this.plate().trim()) this.plateError.set(false);
  }

  checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  async save(): Promise<void> {
    const plate = this.plate().trim();
    if (!plate) {
      this.plateError.set(true);
      return;
    }
    this.saving.set(true);
    const mutation = await this.vehicleService.update(this.id(), { plate, isDefault: this.favorite() });
    this.saving.set(false);
    if (mutation.success) this.result.set('saved');
  }

  remove(): void {
    const current = this.vehicle();
    const isActive =
      this.parkingSessionService.isVehicleParked(this.id()) ||
      Boolean(current?.plate && this.parkingSessionService.isVehicleParked(current.plate));
    if (isActive) {
      this.blockedDelete.set(true);
      return;
    }
    this.confirmDelete.set(true);
  }

  async confirmRemove(): Promise<void> {
    this.confirmDelete.set(false);
    this.saving.set(true);
    const mutation = await this.vehicleService.remove(this.id());
    this.saving.set(false);
    if (mutation.success) this.result.set('deleted');
  }

  goBack(): void {
    void this.router.navigate(['/app/account/vehicles']);
  }
}
