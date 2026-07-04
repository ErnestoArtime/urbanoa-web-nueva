import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslationService, type SupportedLang } from '../../../core/services/translation.service';

@Component({
  selector: 'app-lang-selector',
  imports: [FormsModule],
  template: `
    <div class="lang-selector-fixed">
      <select class="lang-select" [(ngModel)]="selectedLang" (change)="onChange()">
        <option value="es">ES</option>
        <option value="eu">EU</option>
        <option value="fr">FR</option>
        <option value="uk">UK</option>
      </select>
    </div>
  `,
  styles: `
    .lang-selector-fixed {
      position: fixed;
      top: 0.5rem;
      right: 0.75rem;
      z-index: 999;
    }
    .lang-select {
      border: 1px solid var(--color-border, #ddd);
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 0.8125rem;
      font-weight: 700;
      background: var(--color-surface, #fff);
      color: var(--color-primary, #006a68);
      cursor: pointer;
      appearance: auto;
    }
    @media (min-width: 960px) {
      .lang-selector-fixed {
        top: 0.75rem;
      }
    }
  `,
})
export class LangSelectorComponent {
  private translationService = inject(TranslationService);
  selectedLang: SupportedLang = 'es';

  constructor() {
    this.selectedLang = this.translationService.currentLang$();
  }

  onChange(): void {
    this.translationService.setLang(this.selectedLang);
  }
}
