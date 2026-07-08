import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideCarFront, LucideCircleUserRound, LucideHistory, LucideLayoutGrid } from '@lucide/angular';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NAV_ITEMS } from '../../shared/mock-data';
import { APP_BRAND } from '../../shared/constants/app-brand';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, LucideLayoutGrid, LucideCarFront, LucideHistory, LucideCircleUserRound],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <img src="/assets/brand/arinpark-logo.png" [alt]="brand.name" class="brand-logo" />
      </div>
      <nav class="sidebar-nav">
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: isExactPath(item.path) }"
            class="sidebar-link"
          >
            <span class="sidebar-pill">
              @switch (item.icon) {
                @case ('home') {
                  <svg lucideLayoutGrid class="sidebar-icon" size="25" strokeWidth="2.55"></svg>
                }
                @case ('directions_car') {
                  <svg lucideCarFront class="sidebar-icon" size="25" strokeWidth="2.35"></svg>
                }
                @case ('operations') {
                  <svg lucideHistory class="sidebar-icon" size="25" strokeWidth="2.35"></svg>
                }
                @case ('account') {
                  <svg lucideCircleUserRound class="sidebar-icon" size="25" strokeWidth="2.35"></svg>
                }
              }
            </span>
            @switch (item.path) {
              @case ('/app/home') {
                <span>{{ 'nav.home' | translate }}</span>
              }
              @case ('/app/parking') {
                <span>{{ 'nav.park' | translate }}</span>
              }
              @case ('/app/operations') {
                <span>{{ 'nav.operations' | translate }}</span>
              }
              @case ('/app/account') {
                <span>{{ 'nav.account' | translate }}</span>
              }
            }
          </a>
        }
      </nav>
    </aside>
  `,
  styles: [
    `
      .sidebar {
        display: flex;
        width: var(--sidebar-width);
        background: var(--color-surface);
        border-right: 1px solid var(--color-border);
        flex-direction: column;
        min-height: 100dvh;
        position: sticky;
        top: 0;
      }
      .sidebar-brand {
        display: flex;
        justify-content: center;
        padding: 1.1rem 0.5rem 0.9rem;
        border-bottom: 1px solid var(--color-border);
      }
      .brand-logo {
        display: block;
        width: 78px;
        height: auto;
        object-fit: contain;
      }
      .sidebar-nav {
        display: flex;
        flex: 1;
        flex-direction: column;
        justify-content: center;
        padding: 1.1rem 0.35rem;
      }
      .sidebar-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        min-height: 74px;
        padding: 0.55rem 0.25rem;
        color: var(--color-text);
        text-decoration: none;
        font-weight: var(--font-medium);
        font-size: var(--text-2xs);
        text-align: center;
        transition: background 0.15s;
      }
      .sidebar-link:hover {
        background: var(--color-background);
        text-decoration: none;
      }
      .sidebar-link.active {
        color: var(--color-primary);
      }
      .sidebar-pill {
        display: grid;
        place-items: center;
        width: 58px;
        height: 38px;
        border-radius: 999px;
        transition: background 0.15s;
      }
      .sidebar-link.active .sidebar-pill {
        background: #fde0a4;
      }
      .sidebar-icon {
        width: 22px;
        height: 22px;
        color: var(--color-secondary);
      }
      .sidebar-link.active .sidebar-icon {
        color: var(--color-primary);
      }
    `,
  ],
})
export class SidebarComponent {
  readonly brand = APP_BRAND;
  readonly navItems = NAV_ITEMS;

  isExactPath(path: string): boolean {
    return path === '/app/home';
  }
}
