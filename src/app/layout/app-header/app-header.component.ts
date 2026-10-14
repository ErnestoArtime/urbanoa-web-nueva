import { Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';
import { APP_BRAND } from '../../shared/constants/app-brand';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  template: `
    <header class="app-header">
      @if (showBack()) {
        <button type="button" class="app-header-back" (click)="goBack()" [attr.aria-label]="backAriaLabel()">‹</button>
      } @else {
        <span class="app-header-spacer"></span>
      }
      <h1 class="app-header-title">{{ title() }}</h1>
      <div class="app-header-right">
        <ng-content />
      </div>
    </header>
  `,
  styleUrl: './app-header.component.css',
})
export class AppHeaderComponent {
  private readonly translationService = inject(TranslationService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  title = input(APP_BRAND.name);
  showBack = input(true);

  backAriaLabel = () => this.translationService.translate('common.back');

  goBack(): void {
    const current = this.router.url.split('?')[0];
    const previousSteps: Record<string, string> = {
      '/app/parking/tickets': '/app/parking',
      '/app/parking/ticket': '/app/parking/tickets',
      '/app/parking/time-steps': '/app/parking/tickets',
      '/app/parking/confirm': '/app/parking/time-steps',
    };
    const previous = previousSteps[current];
    if (previous) {
      const queryParams = this.router.parseUrl(this.router.url).queryParams;
      const destination =
        current === '/app/parking/tickets' && queryParams['selectionOrigin'] === 'streets' ? '/app/parking/streets' : previous;
      void this.router.navigate([destination], { queryParams });
      return;
    }
    this.location.back();
  }
}
