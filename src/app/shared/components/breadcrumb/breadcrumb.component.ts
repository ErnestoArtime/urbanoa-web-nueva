import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  template: `
    @if (breadcrumbs().length > 0) {
      <nav class="breadcrumb" [attr.aria-label]="translationService.translate('common.breadcrumb')">
        @for (crumb of breadcrumbs(); track $index; let last = $last) {
          @if (!last && crumb.path) {
            <a [routerLink]="crumb.path" class="breadcrumb-link">{{ labelText(crumb.label) }}</a>
            <span class="breadcrumb-sep">›</span>
          } @else {
            <span class="breadcrumb-current">{{ labelText(crumb.label) }}</span>
          }
        }
      </nav>
    }
  `,
  styleUrl: './breadcrumb.component.css',
})
export class AppBreadcrumbComponent {
  private breadcrumbService = inject(BreadcrumbService);
  readonly translationService = inject(TranslationService);
  readonly breadcrumbs = this.breadcrumbService.breadcrumbs$;

  labelText(label: string): string {
    return label.includes('.') ? this.translationService.translate(label) : label;
  }
}
