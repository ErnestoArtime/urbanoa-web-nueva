import { OperationsService } from '../../core/services/operations.service';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideCarFront, LucideCircleUserRound, LucideHistory, LucideLayoutGrid } from '@lucide/angular';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NAV_ITEMS } from '../../shared/constants/navigation';
import { APP_BRAND } from '../../shared/constants/app-brand';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, LucideLayoutGrid, LucideCarFront, LucideHistory, LucideCircleUserRound],
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
                  <svg lucideLayoutGrid class="sidebar-icon" size="25" strokeWidth="2.55"></svg>
                }
                @case ('directions_car') {
                  <svg lucideCarFront class="sidebar-icon" size="25" strokeWidth="2.35"></svg>
                }
                @case ('operations') {
                  <svg lucideHistory class="sidebar-icon" size="25" strokeWidth="2.35"></svg>
                  @if (operationsBadgeCount() > 0) {
                    <span class="active-count">{{ operationsBadgeCount() }}</span>
                  }
                }
                @case ('account') {
                  <svg lucideCircleUserRound class="sidebar-icon" size="25" strokeWidth="2.35"></svg>
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
