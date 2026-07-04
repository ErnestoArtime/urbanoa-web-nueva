import { Component, input } from '@angular/core';
import { ICON_PATHS, type IconName } from './icon-paths';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg class="app-icon" viewBox="0 0 24 24" aria-hidden="true" [style.width.px]="size()" [style.height.px]="size()">
      <path [attr.d]="path()"></path>
    </svg>
  `,
  styles: [`
    .app-icon {
      display: inline-block;
      fill: currentColor;
      flex-shrink: 0;
    }
  `],
})
export class AppIconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(20);

  readonly path = () => ICON_PATHS[this.name()] ?? ICON_PATHS['about'];
}
