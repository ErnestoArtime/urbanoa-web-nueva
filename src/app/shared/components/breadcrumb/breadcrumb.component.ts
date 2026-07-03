import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  template: `
    @if (breadcrumbs().length > 0) {
      <nav class="breadcrumb" aria-label="Breadcrumb">
        @for (crumb of breadcrumbs(); track $index; let last = $last) {
          @if (!last && crumb.path) {
            <a [routerLink]="crumb.path" class="breadcrumb-link">{{ crumb.label }}</a>
            <span class="breadcrumb-sep">›</span>
          } @else {
            <span class="breadcrumb-current">{{ crumb.label }}</span>
          }
        }
      </nav>
    }
  `,
  styles: [`
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1.25rem;
      font-size: 0.8125rem;
      background: var(--color-surface, #fff);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
      overflow-x: auto;
      white-space: nowrap;
    }
    .breadcrumb-link {
      color: var(--color-primary, #006a68);
      text-decoration: none;
    }
    .breadcrumb-link:hover {
      text-decoration: underline;
    }
    .breadcrumb-sep {
      color: var(--color-muted, #9ca3af);
    }
    .breadcrumb-current {
      color: var(--color-muted, #6b7280);
    }
    @media (min-width: 768px) {
      .breadcrumb {
        padding: 0.5rem 2rem;
      }
    }
  `],
})
export class AppBreadcrumbComponent {
  private breadcrumbService = inject(BreadcrumbService);
  readonly breadcrumbs = this.breadcrumbService.breadcrumbs$;
}
