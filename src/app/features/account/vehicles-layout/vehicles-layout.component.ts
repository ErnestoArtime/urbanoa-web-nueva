import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideStar } from '@lucide/angular';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { TranslationService } from '../../../core/services/translation.service';
import type { Vehicle } from '../../../shared/mock-data';

@Component({
  selector: 'app-vehicles-layout',
  imports: [RouterLink, SplitViewComponent, TranslatePipe, AppIconComponent, LucideStar],
  template: `
    <app-split-view [hideList]="isChildRoute()" [hideDetail]="!isChildRoute()">
      <div splitList class="page has-sticky-actions">
        <h1 class="page-title">{{ 'account.menu.vehicles' | translate }}</h1>
        @if (source() === 'mock' && !lastError()) {
          <p class="data-notice" role="status">Las matrículas se guardan localmente hasta que haya una sesión conectada.</p>
        }
        @if (source() === 'mock' && lastError(); as error) {
          <div class="data-notice data-notice-error" role="alert">
            <p>
              {{ (error.kind === 'backend' ? 'account.vehicles.loadErrorBackend' : 'account.vehicles.loadServerError') | translate }}
            </p>
            <button type="button" class="btn btn-secondary btn-sm" (click)="retry()">
              {{ 'account.vehicles.retry' | translate }}
            </button>
          </div>
        }
        @if (vehicles().length > 0) {
          <ul class="list card" style="padding:0;overflow:hidden">
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
                <button
                  type="button"
                  class="favorite-toggle"
                  [class.is-favorite]="v.isDefault"
                  [disabled]="v.isDefault || togglingId() !== null"
                  [attr.aria-label]="(v.isDefault ? 'account.vehicles.currentFavorite' : 'account.vehicles.markFavorite') | translate"
                  (click)="toggleFavorite(v)"
                >
                  <svg lucideStar [attr.fill]="v.isDefault ? 'currentColor' : 'none'" size="20" strokeWidth="2"></svg>
                </button>
              </li>
            }
          </ul>
          <div class="sticky-actions">
            <a routerLink="/app/account/vehicles/add" class="btn btn-primary btn-block">{{ 'account.addVehicle' | translate }}</a>
          </div>
        } @else {
          <div class="card empty-vehicles">
            <p *ngIf="source() === 'mock'">Las matrículas se guardan localmente hasta que haya una sesión conectada.</p>
            <p *ngIf="source() === 'remote'">Aún no tiene vehículos guardados.</p>
            <a routerLink="/app/account/vehicles/add" class="btn btn-primary btn-block">{{ 'account.addVehicle' | translate }}</a>
          </div>
        }
      </div>
    </app-split-view>
  `,
  styles: [
    `
      .list-item.vehicle-item {
        padding: 0;
        align-items: stretch;
        gap: 0;
      }
      .vehicle-item-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        min-width: 0;
        padding: 0.78rem 0.9rem;
        color: inherit;
        text-decoration: none;
      }
      .favorite-toggle {
        display: grid;
        place-items: center;
        flex: none;
        width: 44px;
        align-self: stretch;
        border: 0;
        border-left: 1px solid var(--color-border);
        background: transparent;
        color: var(--color-text-muted);
        cursor: pointer;
      }
      .favorite-toggle.is-favorite {
        color: var(--color-primary);
      }
      .favorite-toggle:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }
      .data-notice {
        margin: 0 0 1rem;
        padding: 0.75rem 0.9rem;
        border: 1px solid #e5b85c;
        border-radius: var(--radius-md);
        background: #fff8e7;
        color: #714b00;
      }
      .data-notice-error p {
        margin: 0 0 0.5rem;
      }
      .vehicle-icon-wrap {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        flex: none;
        border-radius: var(--radius-md);
        background: var(--color-accent-soft);
        color: var(--color-primary);
      }
      app-icon.vehicle-icon {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
      }
      .vehicle-item .list-item-content {
        gap: 2px;
      }
      .empty-vehicles .btn {
        margin-top: 1rem;
      }
      .empty-vehicles > p {
        margin: 0;
        text-align: center;
      }
      @media (min-width: 960px) {
        .sticky-actions {
          margin-top: 1.5rem;
        }
      }
    `,
  ],
})
export class VehiclesLayoutComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  private readonly parkingSessionService = inject(ParkingSessionService);
  private readonly translation = inject(TranslationService);
  readonly vehicles = this.vehicleService.vehicles;
  readonly source = this.vehicleService.source;
  readonly lastError = this.vehicleService.lastError;
  readonly togglingId = signal<string | null>(null);
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
    await this.vehicleService.load();
    await this.parkingSessionService.loadParkingStatuses(this.vehicles());
  }

  isVehicleParked(vehicle: Vehicle): boolean {
    return this.parkingSessionService.isVehicleParked(vehicle.id) || this.parkingSessionService.isVehicleParked(vehicle.plate);
  }

  translateLabel(value: string): string {
    return this.translation.translateLabel(value);
  }

  async toggleFavorite(vehicle: Vehicle): Promise<void> {
    if (vehicle.isDefault || this.togglingId()) return;
    this.togglingId.set(vehicle.id);
    await this.vehicleService.setDefault(vehicle.id);
    this.togglingId.set(null);
  }
}
