import { AppIconComponent } from '../../shared/icons/app-icon.component';
import { OperationsService } from '../../core/services/operations.service';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NAV_ITEMS } from '../../shared/constants/navigation';
import { APP_BRAND } from '../../shared/constants/app-brand';

@Component({
  selector: 'app-sidebar',
  imports: [AppIconComponent, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <img [src]="brand.logoPath" [alt]="brand.name" class="brand-logo" />
      </div>
      <nav class="sidebar-nav">
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            [routerLinkActiveOptions]="{ exact: isExactPath(item.path) }"
            class="sidebar-link"
          >
            <span class="nav-icon-pill">
              @switch (item.icon) {
                @case ('home') {
                  <app-icon name="home" class="sidebar-icon" [size]="25" [stroke]="false" />
                }
                @case ('directions_car') {
                  <app-icon name="car" class="sidebar-icon" [size]="25" [stroke]="false" />
                }
                @case ('operations') {
                  <app-icon name="operations" class="sidebar-icon" [size]="25" [stroke]="false" />
                  @if (operationsBadgeCount() > 0) {
                    <span class="active-count">{{ operationsBadgeCount() }}</span>
                  }
                }
                @case ('account') {
                  <app-icon name="account" class="sidebar-icon" [size]="25" [stroke]="false" />
                }
              }
            </span>
            <span class="nav-label">{{ item.labelKey | translate }}</span>
          </a>
        }
      </nav>
    </aside>
  `,
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  readonly operationsBadgeCount = inject(OperationsService).operationsBadgeCount;

  readonly brand = APP_BRAND;
  readonly navItems = NAV_ITEMS;

  isExactPath(path: string): boolean {
    return path === '/app/home';
  }
}
