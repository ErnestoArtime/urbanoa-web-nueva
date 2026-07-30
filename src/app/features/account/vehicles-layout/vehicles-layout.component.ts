import { Component, inject } from '@angular/core';
import { RouterLink, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { VehicleService } from '../../../core/services/vehicle.service';

@Component({
  selector: 'app-vehicles-layout',
  imports: [RouterLink, SplitViewComponent, TranslatePipe, AppIconComponent],
  template: `
    <app-split-view [hideList]="isChildRoute()" [hideDetail]="!isChildRoute()">
      <div splitList class="page has-sticky-actions">
        <h1 class="page-title">{{ 'account.menu.vehicles' | translate }}</h1>
        @if (vehicles().length > 0) {
          <ul class="list card" style="padding:0;overflow:hidden">
            @for (v of vehicles(); track v.id) {
              <a [routerLink]="['/app/account/vehicles/edit', v.id]" class="list-item vehicle-item">
                <span class="vehicle-icon-wrap"><app-icon name="vehicle" class="vehicle-icon" [size]="22" [stroke]="false" /></span>
                <div class="list-item-content">
                  <div class="list-item-title">{{ v.plate }}</div>
                  <div class="list-item-subtitle">
                    {{ v.isDefault ? ('account.vehicleFavorite' | translate) : (v.label ?? '' | translate) }}
                  </div>
                  @if (v.isDefault) {
                    <span class="badge badge-primary">{{ 'account.cardPrimary' | translate }}</span>
                  }
                </div>
                <span class="list-item-chevron">›</span>
              </a>
            }
          </ul>
        } @else {
          <div class="card empty-vehicles">
            <p>{{ 'account.vehicles.emptyTitle' | translate }}</p>
            <a routerLink="/app/account/vehicles/add" class="btn btn-primary btn-block">{{ 'account.addVehicle' | translate }}</a>
          </div>
        }
        @if (vehicles().length > 0) {
          <div class="sticky-actions">
            <a routerLink="/app/account/vehicles/add" class="btn btn-primary btn-block">{{ 'account.addVehicle' | translate }}</a>
          </div>
        }
      </div>
    </app-split-view>
  `,
  styles: [
    `
      .vehicle-item {
        gap: 0.75rem !important;
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
export class VehiclesLayoutComponent {
  private readonly vehicleService = inject(VehicleService);
  readonly vehicles = this.vehicleService.vehicles;
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
}
