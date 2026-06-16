import { Component, input } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-header',
  template: `
  <header class="app-header">
    @if (showBack()) {
      <button type="button" class="app-header-back" (click)="goBack()" aria-label="Atrás">‹</button>
    } @else {
      <span class="app-header-spacer"></span>
    }
    <h1 class="app-header-title">{{ title() }}</h1>
    <span class="app-header-spacer"></span>
  </header>
  `,
  styles: `
    .app-header {
      display: flex;
      align-items: center;
      height: var(--header-height);
      padding: 0 0.5rem;
      background: var(--color-surface);
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
      font-size: 1.75rem;
      color: var(--color-primary);
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    .app-header-title {
      flex: 1;
      text-align: center;
      font-size: 1.0625rem;
      font-weight: 700;
    }
    .app-header-spacer { width: 44px; }
    @media (min-width: 768px) {
      .app-header { display: none; }
    }
  `,
})
export class AppHeaderComponent {
  title = input('ArinPark');
  showBack = input(true);

  constructor(private readonly location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
