import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { ACCOUNT_MENU } from '../../../shared/constants/navigation';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { SplitViewComponent } from '../../../layout/split-view/split-view.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { APP_BRAND } from '../../../shared/constants/app-brand';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { WalletService } from '../../../core/services/wallet.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-account-shell',
  imports: [RouterLink, RouterLinkActive, AppIconComponent, SplitViewComponent, TranslatePipe, DecimalPipe],
  template: `
    <app-split-view [class.account-split]="isVehicleRoute()" [hideList]="!isRootRoute()" [hideDetail]="isRootRoute()">
      <div splitList class="account-master">
        <h1 class="page-title">{{ 'account.title' | translate }}</h1>
        <div class="account-profile">
          <span class="account-avatar">{{ user().name.charAt(0) }}</span>
          <div>
            <strong>{{ user().name }} {{ user().surname }}</strong
            ><span>{{ user().email }}</span
            ><span>{{ walletService.balance() | number: '1.2-2' }} €</span>
          </div>
        </div>
        <div class="card wallet-card mb-2 mobile-wallet">
          <p>{{ 'account.walletBalance' | translate }}</p>
          <p class="wallet-balance">{{ walletService.balance() | number: '1.2-2' }} €</p>
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
        <button type="button" class="account-logout" (click)="logout()">
          <app-icon name="logout" class="logout-icon" [size]="18" [stroke]="false" />
          {{ 'account.logout' | translate }}
        </button>
      </div>
    </app-split-view>

    @if (toast()) {
      <div class="toast">{{ toast() }}</div>
    }
  `,
  styleUrl: './account-shell.component.css',
})
export class AccountShellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly translationService = inject(TranslationService);
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
  readonly isVehicleRoute = () => this.url().startsWith('/app/account/vehicles');

  ngOnInit(): void {
    void this.userService.load();
  }

  readonly STORE_URL = APP_BRAND.storeUrl;

  readonly itemGroupLabel = (index: number) => {
    const item = this.menu[index];
    const prev = this.menu[index - 1];
    return index === 0 || prev.groupKey !== item.groupKey ? item.groupKey : null;
  };

  logout(): void {
    void this.authService.logout();
  }

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
        await navigator.share({
          title: this.brand.name,
          text: this.translationService.translate('account.shareText', { brand: this.brand.name }),
          url: this.STORE_URL,
        });
      } catch {
        /* user dismissed share */
      }
    } else {
      try {
        await navigator.clipboard.writeText(this.STORE_URL);
        this.showToast(this.translationService.translate('account.linkCopied'));
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
