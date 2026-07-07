import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NAV_ITEMS, ACCOUNT_MENU } from '../../shared/mock-data';

const CHILD_LABELS = new Map(ACCOUNT_MENU.map((m) => [m.path, m.labelKey]));

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
            @case ('/app/home') {
              <span class="bottom-nav-label">{{ 'nav.home' | translate }}</span>
            }
            @case ('/app/parking') {
              <span class="bottom-nav-label">{{ 'nav.park' | translate }}</span>
            }
            @case ('/app/operations') {
              <span class="bottom-nav-label">{{ childLabelFor(item.path) ?? ('nav.operations' | translate) }}</span>
            }
            @case ('/app/account') {
              <span class="bottom-nav-label">{{ childLabelFor(item.path) ?? ('nav.account' | translate) }}</span>
            }
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
        background: #f6f5e8;
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
        background: currentColor;
        mask-size: contain;
        mask-repeat: no-repeat;
        mask-position: center;
        -webkit-mask-size: contain;
        -webkit-mask-repeat: no-repeat;
      }
      .bottom-nav-item.active .bottom-nav-icon {
        outline: 7px solid var(--color-active);
        outline-offset: -3px;
        border-radius: 50%;
      }
      .bottom-nav-icon[data-icon='dashboard'] {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M240-840h200q33 0 56.5 23.5T520-760v200q0 33-23.5 56.5T440-480H240q-33 0-56.5-23.5T160-560v-200q0-33 23.5-56.5T240-840Zm0 480h200q33 0 56.5 23.5T520-280v120q0 33-23.5 56.5T440-80H240q-33 0-56.5-23.5T160-160v-120q0-33 23.5-56.5T240-360Zm280-480h200q33 0 56.5 23.5T800-760v200q0 33-23.5 56.5T720-480H520q-33 0-56.5-23.5T440-560v-200q0-33 23.5-56.5T520-840Zm0 480h200q33 0 56.5 23.5T800-280v120q0 33-23.5 56.5T720-80H520q-33 0-56.5-23.5T440-160v-120q0-33 23.5-56.5T520-360Z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M240-840h200q33 0 56.5 23.5T520-760v200q0 33-23.5 56.5T440-480H240q-33 0-56.5-23.5T160-560v-200q0-33 23.5-56.5T240-840Zm0 480h200q33 0 56.5 23.5T520-280v120q0 33-23.5 56.5T440-80H240q-33 0-56.5-23.5T160-160v-120q0-33 23.5-56.5T240-360Zm280-480h200q33 0 56.5 23.5T800-760v200q0 33-23.5 56.5T720-480H520q-33 0-56.5-23.5T440-560v-200q0-33 23.5-56.5T520-840Zm0 480h200q33 0 56.5 23.5T800-280v120q0 33-23.5 56.5T720-80H520q-33 0-56.5-23.5T440-160v-120q0-33 23.5-56.5T520-360Z'/%3E%3C/svg%3E");
      }
      .bottom-nav-icon[data-icon='directions_car'] {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M240-200v20q0 25-17.5 42.5T180-120q-25 0-42.5-17.5T120-180v-286q0-7 1-14t3-13l75-213q8-24 29-39t47-15h410q26 0 47 15t29 39l75 213q2 6 3 13t1 14v286q0 25-17.5 42.5T780-120q-25 0-42.5-17.5T720-180v-20H240Zm-8-360h496l-42-120H274l-42 120Zm-32 80v200-200Zm100 160q25 0 42.5-17.5T360-380q0-25-17.5-42.5T300-440q-25 0-42.5 17.5T240-380q0 25 17.5 42.5T300-320Zm360 0q25 0 42.5-17.5T720-380q0-25-17.5-42.5T660-440q-25 0-42.5 17.5T600-380q0 25 17.5 42.5T660-320Zm-460 40h560v-200H200v200Z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M240-200v20q0 25-17.5 42.5T180-120q-25 0-42.5-17.5T120-180v-286q0-7 1-14t3-13l75-213q8-24 29-39t47-15h410q26 0 47 15t29 39l75 213q2 6 3 13t1 14v286q0 25-17.5 42.5T780-120q-25 0-42.5-17.5T720-180v-20H240Zm-8-360h496l-42-120H274l-42 120Zm-32 80v200-200Zm100 160q25 0 42.5-17.5T360-380q0-25-17.5-42.5T300-440q-25 0-42.5 17.5T240-380q0 25 17.5 42.5T300-320Zm360 0q25 0 42.5-17.5T720-380q0-25-17.5-42.5T660-440q-25 0-42.5 17.5T600-380q0 25 17.5 42.5T660-320Zm-460 40h560v-200H200v200Z'/%3E%3C/svg%3E");
      }
      .bottom-nav-icon[data-icon='operations'] {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M480-120q-126 0-223-76.5T131-392q-4-15 6-27.5t27-14.5q16-2 29 6t18 24q24 90 99 147t170 57q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h70q17 0 28.5 11.5T360-600q0 17-11.5 28.5T320-560H160q-17 0-28.5-11.5T120-600v-160q0-17 11.5-28.5T160-800q17 0 28.5 11.5T200-760v54q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm40-376 100 100q11 11 11 28t-11 28q-11 11-28 11t-28-11L452-452q-6-6-9-13.5t-3-15.5v-159q0-17 11.5-28.5T480-680q17 0 28.5 11.5T520-640v144Z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M480-120q-126 0-223-76.5T131-392q-4-15 6-27.5t27-14.5q16-2 29 6t18 24q24 90 99 147t170 57q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h70q17 0 28.5 11.5T360-600q0 17-11.5 28.5T320-560H160q-17 0-28.5-11.5T120-600v-160q0-17 11.5-28.5T160-800q17 0 28.5 11.5T200-760v54q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm40-376 100 100q11 11 11 28t-11 28q-11 11-28 11t-28-11L452-452q-6-6-9-13.5t-3-15.5v-159q0-17 11.5-28.5T480-680q17 0 28.5 11.5T520-640v144Z'/%3E%3C/svg%3E");
      }
      .bottom-nav-icon[data-icon='account'] {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm146.5-204.5Q340-521 340-580t40.5-99.5Q421-720 480-720t99.5 40.5Q620-639 620-580t-40.5 99.5Q539-440 480-440t-99.5-40.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm146.5-204.5Q340-521 340-580t40.5-99.5Q421-720 480-720t99.5 40.5Q620-639 620-580t-40.5 99.5Q539-440 480-440t-99.5-40.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z'/%3E%3C/svg%3E");
      }
    `,
  ],
})
export class BottomNavComponent {
  private readonly router = inject(Router);
  readonly navItems = NAV_ITEMS;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
  );

  /** Returns the child label key if current URL is a child of \`parentPath\`, else null. */
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
