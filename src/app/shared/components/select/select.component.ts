import { Component, ElementRef, computed, forwardRef, inject, input, model, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RuntimeStyleDirective } from '../../directives/runtime-style.directive';
import { AppIconComponent } from '../../icons/app-icon.component';

export interface SelectOption {
  value: string;
  label: string;
}

const PANEL_MAX_HEIGHT = 288;
const PANEL_GAP = 4;

@Component({
  selector: 'app-select',
  imports: [AppIconComponent, RuntimeStyleDirective],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true }],
  host: {
    class: 'app-select',
    '(document:pointerdown)': 'onDocumentPointer($event)',
    '(window:resize)': 'close()',
    '(document:scroll)': 'onScroll($event)',
  },
  template: `
    <button
      #trigger
      type="button"
      class="form-input app-select-trigger"
      role="combobox"
      aria-haspopup="listbox"
      [id]="inputId()"
      [class.open]="open()"
      [class.placeholder]="!selected() && !value()"
      [disabled]="isDisabled()"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="listboxId"
      [attr.aria-activedescendant]="open() ? optionId(activeIndex()) : null"
      [attr.aria-invalid]="invalid() || null"
      (click)="toggle()"
      (keydown)="onKeydown($event)"
      (blur)="touched()"
    >
      <span class="app-select-label">{{ selected()?.label ?? (value() || placeholder()) }}</span>
      <app-icon class="app-select-chevron" name="dropDown" [size]="12" [stroke]="false" ariaLabel="" />
    </button>
    @if (open()) {
      <ul #panel class="app-select-panel" role="listbox" tabindex="-1" [id]="listboxId" [appRuntimeStyle]="panelStyle()">
        @for (option of options(); track option.value; let i = $index) {
          <li
            role="option"
            class="app-select-option"
            [id]="optionId(i)"
            [class.selected]="option.value === value()"
            [class.active]="i === activeIndex()"
            [attr.aria-selected]="option.value === value()"
            (pointerdown)="$event.preventDefault()"
            (click)="choose(option)"
            (pointermove)="activeIndex.set(i)"
          >
            {{ option.label }}
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './select.component.css',
})
export class SelectComponent implements ControlValueAccessor {
  private static nextId = 0;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  readonly listboxId = `app-select-list-${SelectComponent.nextId++}`;
  readonly options = input<readonly SelectOption[]>([]);
  readonly placeholder = input('');
  readonly inputId = input<string | null>(null);
  readonly invalid = input(false);
  readonly value = model('');
  readonly open = signal(false);
  readonly activeIndex = signal(0);
  readonly isDisabled = signal(false);
  readonly panelStyle = signal<Record<string, string>>({});
  readonly selected = computed(() => this.options().find((option) => option.value === this.value()) ?? null);

  optionId(index: number): string {
    return `${this.listboxId}-${index}`;
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
    if (disabled) this.close();
  }

  touched(): void {
    this.onTouched();
  }

  toggle(): void {
    if (this.open()) this.close();
    else this.openPanel();
  }

  close(): void {
    if (this.open()) this.open.set(false);
  }

  choose(option: SelectOption): void {
    if (option.value !== this.value()) {
      this.value.set(option.value);
      this.onChange(option.value);
    }
    this.close();
    this.trigger()?.nativeElement.focus();
  }

  onDocumentPointer(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  onScroll(event: Event): void {
    if (this.open() && !this.panel()?.nativeElement.contains(event.target as Node)) this.close();
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.options().length;
    if (!count) return;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.open()) {
          this.openPanel();
          return;
        }
        const step = event.key === 'ArrowDown' ? 1 : -1;
        this.moveActive((this.activeIndex() + step + count) % count);
        return;
      }
      case 'Home':
      case 'End':
        if (!this.open()) return;
        event.preventDefault();
        this.moveActive(event.key === 'Home' ? 0 : count - 1);
        return;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (!this.open()) {
          this.openPanel();
          return;
        }
        const option = this.options()[this.activeIndex()];
        if (option) this.choose(option);
        return;
      }
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.close();
        }
        return;
      case 'Tab':
        this.close();
        return;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) this.searchByTyping(event.key);
    }
  }

  private openPanel(): void {
    const trigger = this.trigger()?.nativeElement;
    if (!trigger || this.isDisabled() || !this.options().length) return;
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - PANEL_GAP - 8;
    const above = rect.top - PANEL_GAP - 8;
    const openUp = below < Math.min(PANEL_MAX_HEIGHT, 160) && above > below;
    const maxHeight = Math.max(120, Math.min(PANEL_MAX_HEIGHT, openUp ? above : below));
    this.panelStyle.set({
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      '--select-max-height': `${maxHeight}px`,
      top: `${rect.bottom + PANEL_GAP}px`,
    });
    const current = this.options().findIndex((option) => option.value === this.value());
    this.activeIndex.set(Math.max(0, current));
    this.open.set(true);
    setTimeout(() => {
      const panel = this.panel()?.nativeElement;
      if (panel && openUp) {
        this.panelStyle.update((style) => ({ ...style, top: `${rect.top - PANEL_GAP - panel.offsetHeight}px` }));
      }
      this.scrollActiveIntoView();
    });
  }

  private moveActive(index: number): void {
    this.activeIndex.set(index);
    this.scrollActiveIntoView();
  }

  private scrollActiveIntoView(): void {
    this.panel()?.nativeElement.querySelector<HTMLElement>('.active')?.scrollIntoView({ block: 'nearest' });
  }

  private searchByTyping(key: string): void {
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.typeahead += key.toLowerCase();
    this.typeaheadTimer = setTimeout(() => (this.typeahead = ''), 600);
    const options = this.options();
    const start = this.typeahead.length === 1 ? this.activeIndex() + 1 : this.activeIndex();
    for (let offset = 0; offset < options.length; offset++) {
      const index = (start + offset) % options.length;
      if (options[index].label.toLowerCase().startsWith(this.typeahead)) {
        if (this.open()) this.moveActive(index);
        else this.choose(options[index]);
        return;
      }
    }
  }
}
