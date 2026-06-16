import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { MOCK_OPERATIONS } from '../../../shared/mock-data';

@Component({
  selector: 'app-operations-layout',
  imports: [RouterLink, RouterOutlet],
  template: `
    <div class="split-view" style="min-height:calc(100dvh - var(--bottom-nav-height))">
      <div class="split-view-list" [class.split-hidden]="isDetailRoute()">
        <div class="page" style="padding-bottom:0">
          <h1 class="page-title">Operaciones</h1>
          <div class="chip-row">
            @for (f of filters; track f) {
              <span class="chip" [class.active]="f === 'Este mes'">{{ f }}</span>
            }
          </div>
          <ul class="list" style="margin:0 -1.25rem">
            @for (op of operations; track op.id) {
              <a [routerLink]="['/app/operations/detail', op.type]" class="list-item" routerLinkActive="active">
                <div class="list-item-content">
                  <div class="list-item-title">{{ op.title }}</div>
                  <div class="list-item-subtitle">{{ op.date }}</div>
                </div>
                <span>{{ op.amount }}</span>
              </a>
            }
          </ul>
          <a routerLink="/app/operations/unpaid-fines" class="list-item" style="margin-top:0.5rem">
            <div class="list-item-content"><div class="list-item-title">Multas impagadas</div></div>
            <span class="badge badge-error">2</span>
          </a>
          <a routerLink="/app/operations/report" class="list-item">
            <div class="list-item-content"><div class="list-item-title">Generar informe</div></div>
            <span class="list-item-chevron">›</span>
          </a>
        </div>
      </div>
      <div class="split-view-detail" [class.split-hidden]="!isDetailRoute()">
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    .list-item.active { background: rgba(84,129,148,0.1); }
    @media (min-width: 768px) {
      .split-view-detail.split-hidden { display: flex !important; }
    }
  `,
})
export class OperationsLayoutComponent {
  private readonly router = inject(Router);
  readonly operations = MOCK_OPERATIONS;
  readonly filters = ['Hoy', 'Esta semana', 'Este mes', 'Más antiguas'];

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  isDetailRoute = () => this.url().includes('/app/operations/detail/');
}
