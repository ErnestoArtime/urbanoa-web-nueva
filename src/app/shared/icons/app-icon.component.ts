import { Component, input, computed } from '@angular/core';
import { ICON_PATHS, type IconName } from './icon-paths';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      class="app-icon"
      viewBox="0 0 24 24"
      [attr.aria-hidden]="ariaLabel() ? undefined : true"
      [attr.aria-label]="ariaLabel() ?? undefined"
      [style.width]="size() + 'px'"
      [style.height]="size() + 'px'"
      [class.app-icon-stroke]="stroke()"
    >
      <path [attr.d]="path()"></path>
    </svg>
  `,
  styles: [
    `
      .app-icon {
        display: inline-block;
        fill: currentColor;
        flex-shrink: 0;
      }
      .app-icon-stroke {
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    `,
  ],
})
export class AppIconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly stroke = input(true);
  readonly ariaLabel = input<string>();

  readonly path = computed(() => ICON_PATHS[this.name()] ?? ICON_PATHS['about']);
}
