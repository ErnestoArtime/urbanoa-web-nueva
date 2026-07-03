import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { MOCK_VEHICLES } from '../../../shared/mock-data';

@Component({
  selector: 'app-vehicles-layout',
  imports: [RouterLink, RouterOutlet],
  template: `
    <div class="split-view">
      <div class="split-view-list" [class.split-hidden]="isChildRoute()">
        <div class="page">
          <ul class="list card" style="padding:0;overflow:hidden">
            @for (v of vehicles; track v.id) {
              <a routerLink="/app/account/vehicles/edit" class="list-item">
                <div class="list-item-content">
                  <div class="list-item-title">{{ v.plate }}</div>
                  <div class="list-item-subtitle">{{ v.isDefault ? 'Vehículo favorito' : (v.label ?? '') }}</div>
                </div>
                @if (v.isDefault) { <span class="badge badge-primary">★</span> }
              </a>
            }
          </ul>
          <a routerLink="/app/account/vehicles/add" class="btn btn-primary btn-block mt-2">Añadir vehículo</a>
        </div>
      </div>
      <div class="split-view-detail" [class.split-hidden]="!isChildRoute()">
        <router-outlet />
      </div>
    </div>
  `,
  styles: `@media (min-width:768px){.split-view-detail.split-hidden{display:flex!important}}`,
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
