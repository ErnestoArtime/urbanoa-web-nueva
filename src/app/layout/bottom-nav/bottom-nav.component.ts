import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NAV_ITEMS } from '../../shared/mock-data';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <nav class="bottom-nav">
      @for (item of navItems; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: isExactPath(item.path) }"
          class="bottom-nav-item"
        >
          <span class="bottom-nav-icon" [attr.data-icon]="item.icon"></span>
          @switch (item.path) {
            @case ('/app/home') { <span class="bottom-nav-label">{{ 'nav.home' | translate }}</span> }
            @case ('/app/parking') { <span class="bottom-nav-label">{{ 'nav.park' | translate }}</span> }
            @case ('/app/operations') { <span class="bottom-nav-label">{{ 'nav.operations' | translate }}</span> }
            @case ('/app/account') { <span class="bottom-nav-label">{{ 'nav.account' | translate }}</span> }
          }
        </a>
      }
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: var(--bottom-nav-height);
      background: #f6f5e8;
      border-top: 1px solid var(--color-border);
      display: flex;
      z-index: 100;
      box-shadow: 0 -1px 5px rgba(35,58,49,0.08);
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
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.3rem;
    }
    .bottom-nav-item.active { color: var(--color-primary); }
    .bottom-nav-icon {
      width: 25px; height: 25px;
      background: currentColor;
      mask-size: contain; mask-repeat: no-repeat; mask-position: center;
      -webkit-mask-size: contain; -webkit-mask-repeat: no-repeat;
    }
    .bottom-nav-item.active .bottom-nav-icon {
      outline: 7px solid var(--color-active);
      outline-offset: -3px;
      border-radius: 50%;
    }
    .bottom-nav-icon[data-icon='home'] {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'/%3E%3C/svg%3E");
    }
    .bottom-nav-icon[data-icon='parking'] {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z'/%3E%3C/svg%3E");
    }
    .bottom-nav-icon[data-icon='operations'] {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z'/%3E%3C/svg%3E");
    }
    .bottom-nav-icon[data-icon='account'] {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E");
    }
  `],
})
export class BottomNavComponent {
  private readonly router = inject(Router);
  readonly navItems = NAV_ITEMS;

  isExactPath(path: string): boolean {
    return path === '/app/home';
  }
}
