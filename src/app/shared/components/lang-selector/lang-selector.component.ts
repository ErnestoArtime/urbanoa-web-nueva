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
  styleUrl: './lang-selector.component.css',
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
