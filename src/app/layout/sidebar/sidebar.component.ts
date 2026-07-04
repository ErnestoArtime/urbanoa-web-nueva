import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NAV_ITEMS } from '../../shared/mock-data';
import { APP_BRAND } from '../../shared/constants/app-brand';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
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
            <span class="sidebar-icon" [attr.data-icon]="item.icon"></span>
            @switch (item.path) {
              @case ('/app/home') { <span>{{ 'nav.home' | translate }}</span> }
              @case ('/app/parking') { <span>{{ 'nav.park' | translate }}</span> }
              @case ('/app/operations') { <span>{{ 'nav.operations' | translate }}</span> }
              @case ('/app/account') { <span>{{ 'nav.account' | translate }}</span> }
            }
          </a>
        }
      </nav>
    </aside>
  `,
  styles: [`
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
      display:flex;
      justify-content:center;
      padding: 1rem .35rem;
      border-bottom: 1px solid var(--color-border);
    }
    .brand-logo { display:block; width:88px; height:auto; object-fit:contain; }
    .sidebar-nav {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: center;
      padding: 1.1rem .35rem;
    }
    .sidebar-link {
      display: flex;
      flex-direction:column;
      align-items: center;
      justify-content:center;
      gap: 0.35rem;
      min-height:74px;
      padding: 0.55rem .25rem;
      color: var(--color-text);
      text-decoration: none;
      font-weight: var(--font-medium);
      font-size: var(--text-2xs);
      text-align:center;
      transition: background 0.15s;
    }
    .sidebar-link:hover { background: var(--color-background); text-decoration: none; }
    .sidebar-link.active {
      background: var(--color-active);
      color: var(--color-primary);
      border-right: 3px solid var(--color-primary);
      border-radius:18px 0 0 18px;
    }
    .sidebar-icon {
      width: 25px; height: 25px;
      background: var(--color-secondary);
      mask-size: contain; mask-repeat: no-repeat; mask-position: center;
      -webkit-mask-size: contain; -webkit-mask-repeat: no-repeat;
    }
    .sidebar-link.active .sidebar-icon { background: var(--color-primary); }
    .sidebar-icon[data-icon='home'] {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'/%3E%3C/svg%3E");
    }
    .sidebar-icon[data-icon='parking'] {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z'/%3E%3C/svg%3E");
    }
    .sidebar-icon[data-icon='operations'] {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z'/%3E%3C/svg%3E");
    }
    .sidebar-icon[data-icon='account'] {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E");
    }
  `],
})
export class SidebarComponent {
  private readonly router = inject(Router);
  readonly brand = APP_BRAND;
  readonly navItems = NAV_ITEMS;

  isActiveRoute(path: string): boolean {
    const url = this.router.url;
    if (path === '/app/home') return url === '/app/home' || url === '/app/home/';
    return url.startsWith(path);
  }

  isExactPath(path: string): boolean {
    return path === '/app/home';
  }
}
