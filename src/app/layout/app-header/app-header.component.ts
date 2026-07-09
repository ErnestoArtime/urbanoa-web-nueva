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
  styles: `
    .app-header {
      display: flex;
      align-items: center;
      height: var(--header-height);
      padding: 0 0.5rem;
      background: var(--color-background);
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .app-header-back {
      width: 44px;
      height: 44px;
      border: none;
      background: none;
      font-size: var(--text-2xl);
      color: var(--color-primary);
      cursor: pointer;
      line-height: var(--line-tight);
      padding: 0;
    }
    .app-header-title {
      flex: 1;
      text-align: center;
      font-size: var(--text-base);
      font-weight: var(--font-medium);
    }
    .app-header-right {
      width: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .app-header-spacer {
      width: 44px;
    }
    @media (min-width: 960px) {
      .app-header {
        display: none;
      }
    }
  `,
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
      void this.router.navigate([previous], { queryParams });
      return;
    }
    this.location.back();
  }
}
