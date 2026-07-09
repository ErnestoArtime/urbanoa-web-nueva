import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslationService, type SupportedLang } from '../../../core/services/translation.service';

@Component({
  selector: 'app-lang-selector',
  imports: [FormsModule],
  template: `
    <div class="lang-selector">
      <select class="lang-select" [(ngModel)]="selectedLang" (change)="onChange()">
        <option value="es">ES</option>
        <option value="eu">EU</option>
        <option value="fr">FR</option>
        <option value="uk">UK</option>
      </select>
    </div>
  `,
  styles: `
    .lang-selector {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
    }
    .lang-select {
      min-width: 64px;
      height: 32px;
      padding: 0 1.5rem 0 0.7rem;
      border: 1px solid var(--color-border, #d9ddd2);
      border-radius: 10px;
      font-size: var(--text-xs);
      font-weight: var(--font-bold);
      background: var(--color-surface, #f9faef);
      color: var(--color-primary, #006a68);
      cursor: pointer;
      appearance: none;
      box-shadow: var(--shadow-sm);
      background-image:
        linear-gradient(45deg, transparent 50%, var(--color-primary) 50%),
        linear-gradient(135deg, var(--color-primary) 50%, transparent 50%);
      background-position:
        calc(100% - 0.85rem) calc(50% - 1px),
        calc(100% - 0.55rem) calc(50% - 1px);
      background-size:
        5px 5px,
        5px 5px;
      background-repeat: no-repeat;
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
