import { RuntimeStyleDirective } from '../directives/runtime-style.directive';
import { Component, input, computed } from '@angular/core';
import { ICON_PATHS, type IconName } from './icon-paths';

@Component({
  imports: [RuntimeStyleDirective],
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      class="app-icon"
      viewBox="0 -960 960 960"
      [attr.aria-hidden]="ariaLabel() ? undefined : true"
      [attr.aria-label]="ariaLabel() ?? undefined"
      [class.app-icon-stroke]="stroke()"
      [appRuntimeStyle]="{ width: size() + 'px', height: size() + 'px' }"
    >
      <path [attr.d]="path()"></path>
    </svg>
  `,
  styleUrl: './app-icon.component.css',
})
export class AppIconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly stroke = input(true);
  readonly ariaLabel = input<string>();

  readonly path = computed(() => ICON_PATHS[this.name()] ?? ICON_PATHS['about']);
}
