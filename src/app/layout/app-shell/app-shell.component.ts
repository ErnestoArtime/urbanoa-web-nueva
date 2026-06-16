import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { AppHeaderComponent } from '../app-header/app-header.component';

const MAIN_TAB_PATHS = ['/app/home', '/app/parking', '/app/operations', '/app/account'];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, BottomNavComponent, AppHeaderComponent],
  template: `
    <div class="app-shell">
      <app-sidebar class="app-shell-sidebar" />
      <div class="app-shell-main">
        @if (showHeader()) {
          <app-header [title]="headerTitle()" [showBack]="showBack()" />
        }
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
      min-height: 100dvh;
    }
    .app-shell-sidebar {
      display: none;
    }
    .app-shell-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 100dvh;
    }
    .app-shell-content {
      flex: 1;
      overflow-y: auto;
    }
    .app-shell-content.with-bottom-nav {
      padding-bottom: var(--bottom-nav-height);
    }
    .app-shell-bottom-nav {
      display: block;
    }
    @media (min-width: 768px) {
      .app-shell-sidebar { display: flex; }
      .app-shell-bottom-nav { display: none; }
      .app-shell-content.with-bottom-nav { padding-bottom: 0; }
    }
  `,
})
export class AppShellComponent {
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

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
    const titles: Record<string, string> = {
      '/app/parking/cities': 'Ciudades',
      '/app/parking/city-info': 'Información',
      '/app/parking/streets': 'Calles',
      '/app/parking/tickets': 'Tarifas',
      '/app/parking/ticket': 'Ticket',
      '/app/parking/time-steps': 'Duración',
      '/app/parking/confirm': 'Confirmar',
      '/app/parking/success': 'Aparcamiento',
      '/app/operations/detail': 'Detalle',
      '/app/operations/unpaid-fines': 'Multas impagadas',
      '/app/operations/unpaid-fine-detail': 'Detalle multa',
      '/app/operations/report': 'Informe',
      '/app/operations/report-success': 'Informe generado',
      '/app/account/profile': 'Mi perfil',
      '/app/account/settings': 'Ajustes',
      '/app/account/notifications': 'Notificaciones',
      '/app/account/change-password': 'Cambiar contraseña',
      '/app/account/tax-data': 'Datos fiscales',
      '/app/account/vehicles': 'Vehículos',
      '/app/account/vehicles/add': 'Añadir vehículo',
      '/app/account/vehicles/edit': 'Editar vehículo',
      '/app/account/payment-methods': 'Métodos de pago',
      '/app/account/payment-methods/add': 'Añadir tarjeta',
      '/app/account/recharge': 'Recargar saldo',
      '/app/account/refund': 'Retirar saldo',
      '/app/account/about': 'Sobre ArinPark',
      '/app/account/support': 'Soporte',
      '/app/account/support-success': 'Mensaje enviado',
    };
    for (const [path, title] of Object.entries(titles)) {
      if (u.startsWith(path)) return title;
    }
    return 'ArinPark';
  };
}
