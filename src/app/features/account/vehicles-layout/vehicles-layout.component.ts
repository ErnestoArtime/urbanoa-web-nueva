import { Component, inject } from '@angular/core';
import { RouterLink, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { MOCK_VEHICLES } from '../../../shared/mock-data';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';

@Component({
  selector: 'app-vehicles-layout',
  imports: [RouterLink, SplitViewComponent, TranslatePipe, DetailPanelHeaderComponent, AppIconComponent],
  template: `
    <app-split-view [hideList]="isChildRoute()" [hideDetail]="!isChildRoute()">
      <div splitList class="page has-sticky-actions">
        <h1 class="page-title">{{ 'account.menu.vehicles' | translate }}</h1>
        <ul class="list card" style="padding:0;overflow:hidden">
          @for (v of vehicles; track v.id) {
            <a routerLink="/app/account/vehicles/edit" class="list-item vehicle-item">
              <app-icon name="vehicle" class="vehicle-icon" [stroke]="false" />
              <div class="list-item-content">
                <div class="list-item-title">{{ v.plate }}</div>
                <div class="list-item-subtitle">{{ v.isDefault ? ('account.vehicleFavorite' | translate) : (v.label ?? '') }}</div>
                @if (v.isDefault) {
                  <span class="badge badge-primary vehicle-badge">Principal</span>
                }
              </div>
              <span class="list-item-chevron">›</span>
            </a>
          }
        </ul>
        <div class="sticky-actions">
          <a routerLink="/app/account/vehicles/add" class="btn btn-primary btn-block">{{ 'account.addVehicle' | translate }}</a>
        </div>
      </div>
    </app-split-view>
  `,
  styles: [`
    .vehicle-item{gap:.75rem!important}
    .vehicle-icon{width:36px;height:36px;flex-shrink:0;fill:var(--color-primary);background:var(--color-accent-soft);border-radius:var(--radius-md);padding:6px}
    .vehicle-badge{font-size:var(--text-2xs);padding:2px 8px;border-radius:999px;margin-left:.5rem}
    .vehicle-item .list-item-content{gap:2px}
    @media (min-width: 960px) {
      .sticky-actions { margin-top: 1.5rem; }
    }
  `],
})
export class VehiclesLayoutComponent {
  readonly vehicles = MOCK_VEHICLES;
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
