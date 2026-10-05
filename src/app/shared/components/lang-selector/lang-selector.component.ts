import { Component, ElementRef, HostListener, inject, viewChild } from '@angular/core';
import { TranslationService, type SupportedLang } from '../../../core/services/translation.service';

@Component({
  selector: 'app-lang-selector',
  template: `
    <details #dropdown class="lang-selector" (keydown.escape)="close()">
      <summary class="toolbar-control lang-trigger">
        {{ translationService.currentLang$().toUpperCase() }}
        <span class="lang-chevron" aria-hidden="true"></span>
      </summary>
      <div class="lang-options">
        @for (language of languages; track language) {
          <button
            type="button"
            class="lang-option"
            [class.selected]="translationService.currentLang$() === language"
            [attr.aria-pressed]="translationService.currentLang$() === language"
            (click)="select(language)"
          >
            {{ language.toUpperCase() }}
            <span aria-hidden="true">{{ translationService.currentLang$() === language ? '✓' : '' }}</span>
          </button>
        }
      </div>
    </details>
  `,
  styles: `
    :host {
      display: inline-block;
    }
    .lang-selector {
      position: relative;
    }
    .lang-trigger {
      min-width: 64px;
      list-style: none;
    }
    .lang-trigger::-webkit-details-marker {
      display: none;
    }
    .lang-chevron {
      width: 6px;
      height: 6px;
      border-right: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      transform: translateY(-2px) rotate(45deg);
    }
    [open] .lang-chevron {
      transform: translateY(2px) rotate(225deg);
    }
    .lang-options {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      z-index: 2100;
      min-width: 100px;
      padding: 4px;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    .lang-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      width: 100%;
      padding: 0.55rem 0.65rem;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--color-primary);
      font: inherit;
      font-size: var(--text-xs);
      cursor: pointer;
    }
    .lang-option:hover,
    .lang-option.selected {
      background: var(--color-accent-soft);
    }
    .lang-option:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }
  `,
})
export class LangSelectorComponent {
  readonly translationService = inject(TranslationService);
  readonly languages: SupportedLang[] = ['es', 'eu', 'fr', 'uk'];
  private readonly host = inject(ElementRef);
  private readonly dropdown = viewChild<ElementRef<HTMLDetailsElement>>('dropdown');

  select(language: SupportedLang): void {
    void this.translationService.setLang(language);
    this.close();
  }

  close(): void {
    const details = this.dropdown()?.nativeElement;
    if (details?.open) {
      details.open = false;
      details.querySelector('summary')?.focus();
    }
  }

  @HostListener('document:click', ['$event'])
  closeOutside(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target)) {
      const details = this.dropdown()?.nativeElement;
      if (details) details.open = false;
    }
  }
}
