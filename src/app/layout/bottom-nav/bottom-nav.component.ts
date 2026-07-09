import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { LucideCarFront, LucideCircleUserRound, LucideHistory, LucideLayoutGrid } from '@lucide/angular';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NAV_ITEMS, ACCOUNT_MENU } from '../../shared/mock-data';
import { ParkingSessionService } from '../../core/services/parking-session.service';

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
                @if (hasActiveOperation()) {
                  <span class="active-count">1</span>
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
  styles: [
    `
      .bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: var(--bottom-nav-height);
        background: var(--color-background);
        border-top: 1px solid var(--color-border);
        display: flex;
        z-index: 100;
        box-shadow: 0 -1px 5px rgba(35, 58, 49, 0.08);
      }
      .bottom-nav-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.12rem;
        text-decoration: none;
        color: var(--color-secondary);
        font-size: var(--text-2xs);
        font-weight: var(--font-medium);
        padding: 0.3rem;
      }
      .bottom-nav-item.active {
        color: var(--color-primary);
      }
      .bottom-nav-icon {
        width: 25px;
        height: 25px;
        color: currentColor;
      }
      .bottom-nav-pill {
        position: relative;
        display: grid;
        place-items: center;
        width: 52px;
        height: 32px;
        border-radius: var(--radius-pill);
      }
      .active-count {
        position: absolute;
        top: -4px;
        right: 4px;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        border-radius: var(--radius-pill);
        background: #7a3f32;
        color: #fff;
        font-size: var(--text-2xs);
        font-weight: var(--font-bold);
        line-height: 18px;
        text-align: center;
      }
      .bottom-nav-item.active .bottom-nav-pill {
        background: var(--color-active);
      }
    `,
  ],
})
export class BottomNavComponent {
  private readonly router = inject(Router);
  readonly hasActiveOperation = inject(ParkingSessionService).hasActiveParkings;
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
