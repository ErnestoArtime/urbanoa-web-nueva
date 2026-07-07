import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { ACCOUNT_MENU } from '../../../shared/mock-data';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { UserService } from '../../../core/services/user.service';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-account-shell',
  imports: [RouterLink, RouterLinkActive, AppIconComponent, SplitViewComponent, TranslatePipe],
  template: `
    <app-split-view [hideList]="!isRootRoute()" [hideDetail]="isRootRoute()">
      <div splitList class="account-master">
        <h1 class="page-title">{{ 'account.title' | translate }}</h1>
        <div class="account-profile">
          <span class="account-avatar">{{ user().name.charAt(0) }}</span>
          <div>
            <strong>{{ user().name }} {{ user().surname }}</strong
            ><span>{{ user().email }}</span
            ><span>{{ walletService.balance() }} €</span>
          </div>
        </div>
        <div class="card wallet-card mb-2 mobile-wallet">
          <p>{{ 'account.walletBalance' | translate }}</p>
          <p class="wallet-balance">{{ walletService.balance() }} €</p>
        </div>
        <ul class="list account-list">
          @for (item of menu; track item.key; let i = $index) {
            @if (itemGroupLabel(i); as group) {
              <li class="menu-group">{{ group | translate }}</li>
            }
            @if (item.key === 'share' || item.key === 'review') {
              <button type="button" class="list-item account-item" (click)="handleAction(item.key)">
                <app-icon [name]="item.icon" class="account-item-icon" [stroke]="false" />
                <div class="list-item-content">
                  <div class="list-item-title">{{ item.labelKey | translate }}</div>
                </div>
                <span class="list-item-chevron">›</span>
              </button>
            } @else {
              <a
                [routerLink]="item.path"
                class="list-item account-item"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: item.path === '/app/account' }"
              >
                <app-icon [name]="item.icon" class="account-item-icon" [stroke]="false" />
                <div class="list-item-content">
                  <div class="list-item-title">{{ item.labelKey | translate }}</div>
                </div>
                <span class="list-item-chevron">›</span>
              </a>
            }
          }
        </ul>
        <a routerLink="/auth/login" class="list-item account-item logout-item">
          <app-icon name="logout" class="account-item-icon" [stroke]="false" />
          <div class="list-item-content">
            <div class="list-item-title">{{ 'account.logout' | translate }}</div>
          </div>
          <span class="list-item-chevron">›</span>
        </a>
      </div>
    </app-split-view>

    @if (toast()) {
      <div class="toast">{{ toast() }}</div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-height: 0;
      }
      .account-master {
        padding: 1rem;
        padding-bottom: 5rem;
        background: var(--color-surface);
      }
      .logout-item {
        margin-top: -1px;
        border: 1px solid var(--color-border);
        border-radius: 0 0 var(--radius-md) var(--radius-md);
        background: var(--color-surface);
      }
      .account-profile {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        margin: 0.8rem 0 1rem;
      }
      .account-avatar {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--color-accent-soft);
        color: var(--color-primary);
        font-weight: var(--font-extra);
      }
      .account-profile div {
        display: flex;
        flex-direction: column;
        font-size: var(--text-xs);
      }
      .account-profile span {
        color: var(--color-text-muted);
        line-height: var(--line-normal);
      }
      .menu-group {
        list-style: none;
        margin: 0.75rem 0 0.25rem;
        font-size: var(--text-2xs);
        font-weight: var(--font-extra);
        padding: 0 0.9rem;
        color: var(--color-text);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .account-list {
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }
      .account-item {
        width: 100%;
        border: 0;
        text-align: left;
        text-decoration: none;
        color: inherit;
      }
      .account-list .list-item.active {
        background: var(--color-active);
        color: var(--color-primary-dark);
        box-shadow: inset 4px 0 0 var(--color-primary);
      }
      .account-list .list-item.active .list-item-title {
        font-weight: var(--font-extra);
      }
      .account-list .list-item.active .list-item-chevron {
        color: var(--color-primary);
        font-weight: var(--font-extra);
      }
      .account-item-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        fill: var(--color-secondary);
      }
      .account-item.active .account-item-icon {
        fill: var(--color-primary);
      }
      .toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.65rem 1.25rem;
        border-radius: 999px;
        background: var(--color-primary-dark);
        color: #fff;
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
        z-index: 2000;
        animation: fadeInUp 0.25s ease-out;
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      @media (min-width: 960px) {
        .mobile-wallet {
          display: none;
        }
        .account-list {
          border: 0;
          background: transparent;
        }
        .account-list .list-item {
          padding: 0.76rem 0.3rem;
          background: transparent;
        }
      }
    `,
  ],
})
export class AccountShellComponent {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  readonly walletService = inject(WalletService);
  readonly menu = ACCOUNT_MENU;
  readonly user = this.userService.user;
  readonly brand = APP_BRAND;
  readonly toast = signal('');

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isRootRoute = () => this.url() === '/app/account';

  readonly STORE_URL = 'https://play.google.com/store/apps/details?id=com.gerteksa.r.c.mugipark';

  readonly itemGroupLabel = (index: number) => {
    const item = this.menu[index];
    const prev = this.menu[index - 1];
    return index === 0 || prev.groupKey !== item.groupKey ? item.groupKey : null;
  };

  handleAction(key: string): void {
    if (key === 'share') {
      this.shareApp();
    } else if (key === 'review') {
      this.rateApp();
    }
  }

  private async shareApp(): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({ title: this.brand.name, text: `Descarga ${this.brand.name}`, url: this.STORE_URL });
      } catch {
        /* user dismissed share */
      }
    } else {
      try {
        await navigator.clipboard.writeText(this.STORE_URL);
        this.showToast('Enlace copiado');
      } catch {
        /* clipboard unavailable */
      }
    }
  }

  private rateApp(): void {
    window.open(this.STORE_URL, '_blank');
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
  }
}
