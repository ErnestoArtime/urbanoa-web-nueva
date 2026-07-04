import { Component, inject } from '@angular/core';
import { RouterLink, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { MOCK_VEHICLES } from '../../../shared/mock-data';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';

@Component({
  selector: 'app-vehicles-layout',
  imports: [RouterLink, SplitViewComponent, TranslatePipe],
  template: `
    <app-split-view [hideList]="isChildRoute()" [hideDetail]="!isChildRoute()">
      <div splitList class="page has-sticky-actions">
        <ul class="list card" style="padding:0;overflow:hidden">
          @for (v of vehicles; track v.id) {
            <a routerLink="/app/account/vehicles/edit" class="list-item">
              <div class="list-item-content">
                <div class="list-item-title">{{ v.plate }}</div>
                <div class="list-item-subtitle">{{ v.isDefault ? ('account.vehicleFavorite' | translate) : (v.label ?? '') }}</div>
              </div>
              @if (v.isDefault) {
                <span class="badge badge-primary">★</span>
              }
            </a>
          }
        </ul>
        <div class="sticky-actions">
          <a routerLink="/app/account/vehicles/add" class="btn btn-primary btn-block">{{ 'account.addVehicle' | translate }}</a>
        </div>
      </div>
    </app-split-view>
  `,
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
