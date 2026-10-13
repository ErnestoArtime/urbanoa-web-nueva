import { DestroyRef, Directive, ElementRef, effect, inject, input } from '@angular/core';
import { RuntimeStyleRegistry, RuntimeStyles } from '../styles/runtime-style-registry.service';

/** Binds measured UI values to a stylesheet rule owned by this element. */
@Directive({ selector: '[appRuntimeStyle]' })
export class RuntimeStyleDirective {
  readonly appRuntimeStyle = input.required<RuntimeStyles>();
  private readonly binding = inject(RuntimeStyleRegistry).bind(inject(ElementRef<Element>).nativeElement);

  constructor() {
    effect(() => this.binding.update(this.appRuntimeStyle()));
    inject(DestroyRef).onDestroy(() => this.binding.destroy());
  }
}
