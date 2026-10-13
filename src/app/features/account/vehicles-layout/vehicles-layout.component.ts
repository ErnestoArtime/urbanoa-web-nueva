import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { TranslationService } from '../../../core/services/translation.service';
import type { Vehicle } from '../../../shared/models/vehicle';

@Component({
  selector: 'app-vehicles-layout',
  imports: [RouterLink, SplitViewComponent, TranslatePipe, AppIconComponent],
  template: `
    <app-split-view class="vehicles-split" [hideList]="isChildRoute()" [hideDetail]="!isChildRoute()">
      <div splitList class="page has-sticky-actions" [attr.aria-busy]="loadingVehicles()">
        <h1 class="page-title">{{ 'account.menu.vehicles' | translate }}</h1>
        @if (loadingVehicles()) {
          <span class="sr-only" role="status">{{ 'common.loading' | translate }}</span>
        } @else if (vehicleService.source() === 'error') {
          <div class="card" role="alert">
            <p>{{ 'errors.server' | translate }}</p>
            <button type="button" class="btn btn-primary btn-block" (click)="retry()">{{ 'common.retry' | translate }}</button>
          </div>
        } @else if (vehicles().length > 0) {
          <ul class="list card vehicles-list">
            @for (v of vehicles(); track v.id) {
              <li class="list-item vehicle-item">
                <a [routerLink]="['/app/account/vehicles/edit', v.id]" class="vehicle-item-link">
                  <span class="vehicle-icon-wrap"><app-icon name="vehicle" class="vehicle-icon" [size]="22" [stroke]="false" /></span>
                  <div class="list-item-content">
                    <div class="list-item-title">{{ v.plate }}</div>
                    <div class="list-item-subtitle">
                      @if (v.isDefault) {
                        {{ 'account.vehicleFavorite' | translate }}
                      } @else if (v.label; as label) {
                        {{ translateLabel(label) }}
                      }
                    </div>
                    @if (v.isDefault) {
                      <span class="badge badge-primary">{{ 'account.cardPrimary' | translate }}</span>
                    }
                    @if (isVehicleParked(v)) {
                      <span class="badge badge-warning">{{ 'account.vehicle.alreadyParked' | translate }}</span>
                    }
                  </div>
                  <span class="list-item-chevron">›</span>
                </a>
              </li>
            }
          </ul>
          <div class="sticky-actions">
            <a routerLink="/app/account/vehicles/add" class="btn btn-primary btn-block">{{ 'account.addVehicle' | translate }}</a>
          </div>
        } @else {
          <div class="card empty-vehicles">
            <p>{{ 'account.vehicles.noneSaved' | translate }}</p>
            <a routerLink="/app/account/vehicles/add" class="btn btn-primary btn-block">{{ 'account.addVehicle' | translate }}</a>
          </div>
        }
      </div>
    </app-split-view>
  `,
  styleUrl: './vehicles-layout.component.css',
})
export class VehiclesLayoutComponent implements OnInit {
  readonly vehicleService = inject(VehicleService);
  private readonly parkingSessionService = inject(ParkingSessionService);
  private readonly translation = inject(TranslationService);
  readonly vehicles = this.vehicleService.vehicles;
  readonly loadingVehicles = signal(true);
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  isChildRoute = () => {
    const u = this.url();
    return u.includes('/vehicles/add') || u.includes('/vehicles/edit');
  };

  async ngOnInit(): Promise<void> {
    await this.retry();
  }

  async retry(): Promise<void> {
    this.loadingVehicles.set(true);
    try {
      await this.vehicleService.load();
    } finally {
      this.loadingVehicles.set(false);
    }
    await this.parkingSessionService.loadParkingStatuses(this.vehicles());
  }

  isVehicleParked(vehicle: Vehicle): boolean {
    return this.parkingSessionService.isVehicleParked(vehicle.id) || this.parkingSessionService.isVehicleParked(vehicle.plate);
  }

  translateLabel(value: string): string {
    return this.translation.translateLabel(value);
  }
}
