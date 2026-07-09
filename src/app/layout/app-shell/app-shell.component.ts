import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, NavigationStart, NavigationCancel, NavigationError } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AppBreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { LangSelectorComponent } from '../../shared/components/lang-selector/lang-selector.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { TranslationService } from '../../core/services/translation.service';

const MAIN_TAB_PATHS = ['/app/home', '/app/parking', '/app/operations', '/app/account'];

const TITLE_KEYS: Record<string, string> = {
  '/app/parking/cities': 'parking.selectMunicipio',
  '/app/parking/city-info': 'parking.title',
  '/app/parking/streets': 'parking.selectStreet',
  '/app/parking/tickets': 'parking.tariff',
  '/app/parking/ticket': 'parking.title',
  '/app/parking/time-steps': 'parking.extend',
  '/app/parking/confirm': 'parking.confirmStart',
  '/app/parking/success': 'parking.success',
  '/app/operations/detail': 'ops.detail',
  '/app/operations/unpaid-fines': 'ops.denuncias',
  '/app/operations/unpaid-fine-detail': 'ops.detail',
  '/app/operations/report': 'ops.report',
  '/app/operations/report-success': 'ops.report',
  '/app/account/profile': 'account.profile',
  '/app/account/settings': 'account.settings',
  '/app/account/notifications': 'account.title',
  '/app/account/change-password': 'account.settings',
  '/app/account/tax-data': 'account.taxData',
  '/app/account/vehicles': 'account.vehicles',
  '/app/account/vehicles/add': 'account.vehicles',
  '/app/account/vehicles/edit': 'account.vehicles',
  '/app/account/payment-methods': 'account.paymentMethods',
  '/app/account/payment-methods/add': 'account.paymentMethods',
  '/app/account/payment-methods/recharge': 'dashboard.recharge',
  '/app/account/payment-methods/refund': 'ops.type.balanceRefund',
  '/app/account/about': 'app.title',
  '/app/account/support': 'account.support',
  '/app/account/support-success': 'account.support',
};

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    SidebarComponent,
    BottomNavComponent,
    AppHeaderComponent,
    AppBreadcrumbComponent,
    LangSelectorComponent,
    LoaderComponent,
    TranslatePipe,
  ],
  template: `
    <div class="app-shell">
      <app-sidebar class="app-shell-sidebar" />
      <div class="app-shell-main">
        <app-loader [visible]="routeTransitionLoading()" [message]="'common.loading' | translate" imageSrc="/assets/brand/login-logo.jpg" />
        @if (showHeader()) {
          <app-header [title]="headerTitle()" [showBack]="showBack()" />
        }
        <div class="app-shell-toolbar">
          <app-breadcrumb />
          <div class="app-shell-toolbar-actions">
            <app-lang-selector />
          </div>
        </div>
        <main class="app-shell-content" [class.with-bottom-nav]="showBottomNav()">
          <router-outlet />
        </main>
        @if (showBottomNav()) {
          <app-bottom-nav class="app-shell-bottom-nav" />
        }
      </div>
    </div>
  `,
  styles: `
    .app-shell {
      display: flex;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100dvh;
      background: var(--color-background);
      overflow: hidden;
    }
    .app-shell-sidebar {
      display: none;
    }
    .app-shell-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      height: 100%;
      overflow: hidden;
    }
    :host {
      position: relative;
    }
    .app-shell-content {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
    .app-shell-content.with-bottom-nav {
      padding-bottom: var(--bottom-nav-height);
    }
    .app-shell-bottom-nav {
      display: block;
    }
    .app-shell-toolbar {
      display: none;
    }
    app-breadcrumb,
    app-lang-selector {
      display: none;
    }
    app-header {
      display: block;
    }
    @media (min-width: 960px) {
      .app-shell-sidebar {
        display: flex;
      }
      .app-shell-bottom-nav {
        display: none;
      }
      .app-shell-content.with-bottom-nav {
        padding-bottom: 0;
      }
      app-header {
        display: none;
      }
      .app-shell-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-height: 52px;
        padding: 0.35rem 1rem 0.35rem 1.25rem;
        border-bottom: 1px solid var(--color-border);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));
        position: sticky;
        top: 0;
        z-index: 25;
      }
      .app-shell-toolbar-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      app-lang-selector {
        display: block;
      }
      app-breadcrumb {
        display: block;
        flex: 1;
      }
    }
  `,
})
export class AppShellComponent {
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translationService = inject(TranslationService);
  readonly routeTransitionLoading = signal(false);
  private readonly routeTransitionMinMs = 1000;
  private routeTransitionStartedAt = 0;
  private routeTransitionHideTimer?: ReturnType<typeof setTimeout>;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        startWith({ urlAfterRedirects: this.router.url } as NavigationEnd),
      )
      .subscribe((e) => {
        this.breadcrumbService.setFromUrl(e.urlAfterRedirects);
      });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (this.routeTransitionHideTimer !== undefined) {
          clearTimeout(this.routeTransitionHideTimer);
          this.routeTransitionHideTimer = undefined;
        }
        this.routeTransitionStartedAt = Date.now();
        this.routeTransitionLoading.set(true);
      }
      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        const elapsed = Date.now() - this.routeTransitionStartedAt;
        const remaining = Math.max(this.routeTransitionMinMs - elapsed, 0);
        if (remaining === 0) {
          this.routeTransitionLoading.set(false);
          return;
        }
        this.routeTransitionHideTimer = setTimeout(() => {
          this.routeTransitionLoading.set(false);
          this.routeTransitionHideTimer = undefined;
        }, remaining);
      }
    });
  }

  showBottomNav = () => {
    const u = this.url();
    return MAIN_TAB_PATHS.some((p) => u === p || u === p + '/');
  };

  showHeader = () => {
    const u = this.url();
    return !MAIN_TAB_PATHS.some((p) => u === p || u === p + '/');
  };

  showBack = () => true;

  headerTitle = () => {
    const u = this.url();
    for (const [path, key] of Object.entries(TITLE_KEYS)) {
      if (u.startsWith(path)) return this.translationService.translate(key);
    }
    return this.translationService.translate('app.title');
  };
}
