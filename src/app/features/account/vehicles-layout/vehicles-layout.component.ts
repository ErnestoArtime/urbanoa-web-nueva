import { ApiErrorPipe } from '../../../shared/pipes/api-error.pipe';
import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterLink, NavigationEnd, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { VehicleAddComponent } from '../vehicle-add/vehicle-add.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { RuntimeStyleDirective } from '../../../shared/directives/runtime-style.directive';
import { VehicleService } from '../../../core/services/vehicle.service';
import { OperationsService } from '../../../core/services/operations.service';
import { ParkingSessionService } from '../../../core/services/parking-session.service';
import { TranslationService } from '../../../core/services/translation.service';
import type { Vehicle } from '../../../shared/models/vehicle';

const MENU_WIDTH = 260;
const MENU_HEIGHT = 120;
const MENU_GAP = 4;
const VIEWPORT_PADDING = 8;

@Component({
  selector: 'app-vehicles-layout',
  imports: [
    ApiErrorPipe,
    RouterLink,
    SplitViewComponent,
    VehicleAddComponent,
    TranslatePipe,
    AppIconComponent,
    LoaderComponent,
    ResultModalComponent,
    RuntimeStyleDirective,
  ],
  template: `
    <app-loader [visible]="busy()" [message]="'common.loading' | translate" />
    <app-split-view
      class="vehicles-split"
      [hideList]="isChildRoute() && !wideLayout()"
      [hideDetail]="!isChildRoute() && !wideLayout()"
      [showOutlet]="isChildRoute() && !wideLayout()"
      [projectDetail]="wideLayout()"
      emptyMessageKey="account.vehicles.empty"
    >
      <div splitList class="page has-sticky-actions" [attr.aria-busy]="loadingVehicles()">
        <h1 class="page-title">{{ 'account.menu.vehicles' | translate }}</h1>
        @if (loadingVehicles()) {
          <span class="sr-only" role="status">{{ 'common.loading' | translate }}</span>
          <div class="card vehicles-skeleton" aria-hidden="true">
            @for (row of skeletonRows; track row) {
              <div class="vehicle-skeleton-row">
                <span class="skeleton-block skeleton-icon"></span>
                <span class="skeleton-copy"><i class="skeleton-block"></i><i class="skeleton-block"></i></span>
                <span class="skeleton-block skeleton-menu"></span>
              </div>
            }
          </div>
        } @else if (vehicleService.source() === 'error') {
          <div class="card" role="alert">
            <p>{{ errorForDisplay() | apiError: 'errors.server' }}</p>
            <button type="button" class="btn btn-primary btn-block" (click)="retry()">{{ 'common.retry' | translate }}</button>
          </div>
        } @else if (vehicles().length > 0) {
          <ul class="list card vehicles-list" (scroll)="closeMenu()">
            @for (v of sortedVehicles(); track v.id) {
              <li class="list-item vehicle-item">
                <div class="vehicle-item-row">
                  <div class="vehicle-link">
                    <span class="vehicle-icon-wrap"><app-icon name="car" class="vehicle-icon" [size]="22" [stroke]="false" /></span>
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
                  </div>
                  @if (!v.isDefault) {
                    <button
                      type="button"
                      class="kebab-button"
                      [attr.aria-label]="'account.vehicleOptions' | translate: { plate: v.plate }"
                      [attr.aria-expanded]="activeMenu() === v.id"
                      (click)="toggleMenu(v.id, $event)"
                    >
                      ⋮
                    </button>
                    @if (activeMenu() === v.id) {
                      <div class="vehicle-menu" role="menu" [appRuntimeStyle]="menuStyles()">
                        <button type="button" role="menuitem" (click)="requestDelete(v)">
                          <app-icon name="delete" [size]="20" [stroke]="false" /> {{ 'common.delete' | translate }}
                        </button>
                        <button type="button" role="menuitem" (click)="makeFavorite(v)">
                          <app-icon name="favorite" [size]="20" [stroke]="false" /> {{ 'account.vehicleEdit.favorite' | translate }}
                        </button>
                      </div>
                    }
                  }
                </div>
              </li>
            }
          </ul>
        } @else {
          <div class="card empty-vehicles">
            <p>{{ 'account.vehicles.noneSaved' | translate }}</p>
          </div>
        }
        @if (!loadingVehicles() && vehicleService.source() !== 'error') {
          @if (wideLayout()) {
            <div class="list-actions">
              <button type="button" class="btn btn-primary btn-block" (click)="enableAdd()">{{ 'account.addVehicle' | translate }}</button>
            </div>
          } @else {
            <div class="sticky-actions">
              <a routerLink="/app/account/vehicles/add" class="btn btn-primary btn-block">{{ 'account.addVehicle' | translate }}</a>
            </div>
          }
        }
      </div>
      <app-vehicle-add
        splitDetailContent
        [embedded]="true"
        [enabled]="addEnabled()"
        [focusRequest]="focusTick()"
        (done)="addEnabled.set(false)"
      />
    </app-split-view>

    @if (confirmDelete(); as vehicle) {
      <app-result-modal
        type="delete"
        [title]="'account.vehicleEdit.confirmDeleteTitle' | translate"
        [message]="'account.vehicleEdit.confirmDeleteMessage' | translate"
        [primaryText]="'common.delete' | translate"
        [secondaryText]="'common.cancel' | translate"
        (primaryAction)="confirmRemove(vehicle)"
        (secondaryAction)="confirmDelete.set(null)"
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
    @if (actionFailed()) {
      <app-result-modal
        type="error"
        [title]="'errors.server' | translate"
        [message]="actionError() | apiError: 'errors.server'"
        [primaryText]="'common.accept' | translate"
        (primaryAction)="actionFailed.set(false)"
      />
    }
  `,
  styleUrl: './vehicles-layout.component.css',
})
export class VehiclesLayoutComponent implements OnInit {
  readonly skeletonRows = [0, 1, 2];
  errorForDisplay(): unknown {
    return this.vehicleService.lastError?.();
  }

  readonly vehicleService = inject(VehicleService);
  private readonly operationsService = inject(OperationsService);
  private readonly parkingSessionService = inject(ParkingSessionService);
  private readonly translation = inject(TranslationService);
  readonly vehicles = this.vehicleService.vehicles;
  readonly sortedVehicles = computed(() => [...this.vehicles()].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)));
  readonly loadingVehicles = signal(true);
  readonly busy = signal(false);
  readonly addEnabled = signal(false);
  readonly focusTick = signal(0);
  readonly activeMenu = signal<string | null>(null);
  readonly menuPosition = signal<{ top: number; left: number } | null>(null);
  readonly confirmDelete = signal<Vehicle | null>(null);
  readonly blockedDelete = signal(false);
  readonly actionFailed = signal(false);
  readonly actionError = signal<unknown>(null);
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  readonly wideLayout = toSignal(
    new Observable<boolean>((subscriber) => {
      if (typeof window === 'undefined') {
        subscriber.next(false);
        subscriber.complete();
        return;
      }
      const query = window.matchMedia('(min-width: 960px)');
      subscriber.next(query.matches);
      const onChange = (event: MediaQueryListEvent) => subscriber.next(event.matches);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }),
    { initialValue: typeof window !== 'undefined' && window.matchMedia('(min-width: 960px)').matches },
  );
  isChildRoute = () => {
    const u = this.url();
    return u.includes('/vehicles/add');
  };

  enableAdd(): void {
    this.addEnabled.set(true);
    this.focusTick.update((n) => n + 1);
  }

  menuStyles(): Record<string, string> {
    const position = this.menuPosition();
    return position ? { top: `${position.top}px`, left: `${position.left}px` } : {};
  }

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

  toggleMenu(id: string, event: MouseEvent): void {
    if (this.activeMenu() === id) {
      this.closeMenu();
      return;
    }
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const openAbove = window.innerHeight - bounds.bottom - VIEWPORT_PADDING < MENU_HEIGHT && bounds.top > MENU_HEIGHT;
    const top = openAbove ? bounds.top - MENU_HEIGHT - MENU_GAP : bounds.bottom + MENU_GAP;
    const left = Math.max(VIEWPORT_PADDING, Math.min(bounds.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING));
    this.menuPosition.set({ top, left });
    this.activeMenu.set(id);
  }

  @HostListener('document:click', ['$event'])
  closeMenuOnOutsideClick(event: MouseEvent): void {
    if (event.target instanceof Element && !event.target.closest('.kebab-button, .vehicle-menu')) this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  @HostListener('window:scroll')
  @HostListener('window:resize')
  closeMenu(): void {
    if (!this.activeMenu()) return;
    this.activeMenu.set(null);
    this.menuPosition.set(null);
  }

  requestDelete(vehicle: Vehicle): void {
    this.closeMenu();
    if (this.isVehicleParked(vehicle)) {
      this.blockedDelete.set(true);
      return;
    }
    this.confirmDelete.set(vehicle);
  }

  async confirmRemove(vehicle: Vehicle): Promise<void> {
    this.confirmDelete.set(null);
    await this.mutate(() => this.vehicleService.remove(vehicle.id));
  }

  async makeFavorite(vehicle: Vehicle): Promise<void> {
    this.closeMenu();
    await this.mutate(() => this.vehicleService.update(vehicle.id, { isDefault: true }));
  }

  private async mutate(action: () => Promise<{ success: boolean; error?: unknown }>): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const result = await action();
      if (result.success) await this.operationsService.load();
      else this.fail(result.error);
    } catch (error) {
      this.fail(error);
    } finally {
      this.busy.set(false);
    }
  }

  private fail(error: unknown): void {
    this.actionError.set(error);
    this.actionFailed.set(true);
  }
}
