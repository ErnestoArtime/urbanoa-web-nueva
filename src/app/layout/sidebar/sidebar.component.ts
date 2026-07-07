import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
            <span class="sidebar-pill">
              <span class="sidebar-icon" [attr.data-icon]="item.icon"></span>
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
        width: 25px;
        height: 25px;
        background: var(--color-secondary);
        mask-size: contain;
        mask-repeat: no-repeat;
        mask-position: center;
        -webkit-mask-size: contain;
        -webkit-mask-repeat: no-repeat;
      }
      .sidebar-link.active .sidebar-icon {
        background: var(--color-primary);
      }
      .sidebar-icon[data-icon='home'] {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960'%3E%3Cpath d='M240-200h120v-200q0-17 11.5-28.5T400-440h160q17 0 28.5 11.5T600-400v200h120v-360L480-740 240-560v360Zm-80 0v-360q0-19 8.5-36t23.5-28l240-180q21-16 48-16t48 16l240 180q15 11 23.5 28t8.5 36v360q0 33-23.5 56.5T720-120H560q-17 0-28.5-11.5T520-160v-200h-80v200q0 17-11.5 28.5T400-120H240q-33 0-56.5-23.5T160-200Z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960'%3E%3Cpath d='M240-200h120v-200q0-17 11.5-28.5T400-440h160q17 0 28.5 11.5T600-400v200h120v-360L480-740 240-560v360Zm-80 0v-360q0-19 8.5-36t23.5-28l240-180q21-16 48-16t48 16l240 180q15 11 23.5 28t8.5 36v360q0 33-23.5 56.5T720-120H560q-17 0-28.5-11.5T520-160v-200h-80v200q0 17-11.5 28.5T400-120H240q-33 0-56.5-23.5T160-200Z'/%3E%3C/svg%3E");
      }
      .sidebar-icon[data-icon='dashboard'] {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M240-840h200q33 0 56.5 23.5T520-760v200q0 33-23.5 56.5T440-480H240q-33 0-56.5-23.5T160-560v-200q0-33 23.5-56.5T240-840Zm0 480h200q33 0 56.5 23.5T520-280v120q0 33-23.5 56.5T440-80H240q-33 0-56.5-23.5T160-160v-120q0-33 23.5-56.5T240-360Zm280-480h200q33 0 56.5 23.5T800-760v200q0 33-23.5 56.5T720-480H520q-33 0-56.5-23.5T440-560v-200q0-33 23.5-56.5T520-840Zm0 480h200q33 0 56.5 23.5T800-280v120q0 33-23.5 56.5T720-80H520q-33 0-56.5-23.5T440-160v-120q0-33 23.5-56.5T520-360Z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M240-840h200q33 0 56.5 23.5T520-760v200q0 33-23.5 56.5T440-480H240q-33 0-56.5-23.5T160-560v-200q0-33 23.5-56.5T240-840Zm0 480h200q33 0 56.5 23.5T520-280v120q0 33-23.5 56.5T440-80H240q-33 0-56.5-23.5T160-160v-120q0-33 23.5-56.5T240-360Zm280-480h200q33 0 56.5 23.5T800-760v200q0 33-23.5 56.5T720-480H520q-33 0-56.5-23.5T440-560v-200q0-33 23.5-56.5T520-840Zm0 480h200q33 0 56.5 23.5T800-280v120q0 33-23.5 56.5T720-80H520q-33 0-56.5-23.5T440-160v-120q0-33 23.5-56.5T520-360Z'/%3E%3C/svg%3E");
      }
      .sidebar-icon[data-icon='directions_car'] {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M240-200v20q0 25-17.5 42.5T180-120q-25 0-42.5-17.5T120-180v-286q0-7 1-14t3-13l75-213q8-24 29-39t47-15h410q26 0 47 15t29 39l75 213q2 6 3 13t1 14v286q0 25-17.5 42.5T780-120q-25 0-42.5-17.5T720-180v-20H240Zm-8-360h496l-42-120H274l-42 120Zm-32 80v200-200Zm100 160q25 0 42.5-17.5T360-380q0-25-17.5-42.5T300-440q-25 0-42.5 17.5T240-380q0 25 17.5 42.5T300-320Zm360 0q25 0 42.5-17.5T720-380q0-25-17.5-42.5T660-440q-25 0-42.5 17.5T600-380q0 25 17.5 42.5T660-320Zm-460 40h560v-200H200v200Z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M240-200v20q0 25-17.5 42.5T180-120q-25 0-42.5-17.5T120-180v-286q0-7 1-14t3-13l75-213q8-24 29-39t47-15h410q26 0 47 15t29 39l75 213q2 6 3 13t1 14v286q0 25-17.5 42.5T780-120q-25 0-42.5-17.5T720-180v-20H240Zm-8-360h496l-42-120H274l-42 120Zm-32 80v200-200Zm100 160q25 0 42.5-17.5T360-380q0-25-17.5-42.5T300-440q-25 0-42.5 17.5T240-380q0 25 17.5 42.5T300-320Zm360 0q25 0 42.5-17.5T720-380q0-25-17.5-42.5T660-440q-25 0-42.5 17.5T600-380q0 25 17.5 42.5T660-320Zm-460 40h560v-200H200v200Z'/%3E%3C/svg%3E");
      }
      .sidebar-icon[data-icon='operations'] {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M480-120q-126 0-223-76.5T131-392q-4-15 6-27.5t27-14.5q16-2 29 6t18 24q24 90 99 147t170 57q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h70q17 0 28.5 11.5T360-600q0 17-11.5 28.5T320-560H160q-17 0-28.5-11.5T120-600v-160q0-17 11.5-28.5T160-800q17 0 28.5 11.5T200-760v54q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm40-376 100 100q11 11 11 28t-11 28q-11 11-28 11t-28-11L452-452q-6-6-9-13.5t-3-15.5v-159q0-17 11.5-28.5T480-680q17 0 28.5 11.5T520-640v144Z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M480-120q-126 0-223-76.5T131-392q-4-15 6-27.5t27-14.5q16-2 29 6t18 24q24 90 99 147t170 57q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h70q17 0 28.5 11.5T360-600q0 17-11.5 28.5T320-560H160q-17 0-28.5-11.5T120-600v-160q0-17 11.5-28.5T160-800q17 0 28.5 11.5T200-760v54q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm40-376 100 100q11 11 11 28t-11 28q-11 11-28 11t-28-11L452-452q-6-6-9-13.5t-3-15.5v-159q0-17 11.5-28.5T480-680q17 0 28.5 11.5T520-640v144Z'/%3E%3C/svg%3E");
      }
      .sidebar-icon[data-icon='account'] {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm146.5-204.5Q340-521 340-580t40.5-99.5Q421-720 480-720t99.5 40.5Q620-639 620-580t-40.5 99.5Q539-440 480-440t-99.5-40.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z'/%3E%3C/svg%3E");
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960' fill='currentColor'%3E%3Cpath d='M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm146.5-204.5Q340-521 340-580t40.5-99.5Q421-720 480-720t99.5 40.5Q620-639 620-580t-40.5 99.5Q539-440 480-440t-99.5-40.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z'/%3E%3C/svg%3E");
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
