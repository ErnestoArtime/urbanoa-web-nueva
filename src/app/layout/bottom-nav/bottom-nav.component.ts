import { OperationsService } from '../../core/services/operations.service';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { LucideCarFront, LucideCircleUserRound, LucideHistory, LucideLayoutGrid } from '@lucide/angular';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NAV_ITEMS, ACCOUNT_MENU } from '../../shared/constants/navigation';

const CHILD_LABELS = new Map(ACCOUNT_MENU.map((m) => [m.path, m.labelKey]));

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, LucideLayoutGrid, LucideCarFront, LucideHistory, LucideCircleUserRound],
  template: `
    <nav class="bottom-nav">
      @for (item of navItems; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
          [routerLinkActiveOptions]="{ exact: isExactPath(item.path) }"
          class="bottom-nav-item"
        >
          <span class="bottom-nav-pill">
            @switch (item.icon) {
              @case ('home') {
                <svg lucideLayoutGrid class="bottom-nav-icon" size="25" strokeWidth="2.55"></svg>
              }
              @case ('directions_car') {
                <svg lucideCarFront class="bottom-nav-icon" size="25" strokeWidth="2.35"></svg>
              }
              @case ('operations') {
                <svg lucideHistory class="bottom-nav-icon" size="25" strokeWidth="2.35"></svg>
                @if (operationsBadgeCount() > 0) {
                  <span class="active-count">{{ operationsBadgeCount() }}</span>
                }
              }
              @case ('account') {
                <svg lucideCircleUserRound class="bottom-nav-icon" size="25" strokeWidth="2.35"></svg>
              }
            }
          </span>
          @if (childLabelFor(item.path); as childLabel) {
            <span class="bottom-nav-label">{{ childLabel | translate }}</span>
          } @else {
            <span class="bottom-nav-label">{{ item.labelKey | translate }}</span>
          }
        </a>
      }
    </nav>
  `,
  styleUrl: './bottom-nav.component.css',
})
export class BottomNavComponent {
  readonly operationsBadgeCount = inject(OperationsService).operationsBadgeCount;
  private readonly router = inject(Router);
  readonly navItems = NAV_ITEMS;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
  );

  /** Returns the child label key if current URL is a child of `parentPath`, else null. */
  childLabelFor(parentPath: string): string | null {
    const url = this.currentUrl();
    if (!url || url === parentPath) return null;
    const prefix = parentPath + '/';
    if (!url.startsWith(prefix)) return null;
    const childPath = url.split('?')[0];
    return CHILD_LABELS.get(childPath) ?? null;
  }

  isExactPath(path: string): boolean {
    return path === '/app/home';
  }
}
