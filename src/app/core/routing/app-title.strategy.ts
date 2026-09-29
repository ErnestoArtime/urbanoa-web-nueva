import { effect, inject, Injectable, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslationService } from '../services/translation.service';

@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private readonly browserTitle = inject(Title);
  private readonly translations = inject(TranslationService);
  private readonly titleKey = signal<string | undefined>(undefined);

  constructor() {
    super();

    effect(() => {
      // Track catalogue changes so the title follows the selected language
      // without requiring another navigation.
      this.translations.translations$();
      this.browserTitle.setTitle(this.resolveTitle(this.titleKey()));
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.titleKey.set(this.buildTitle(snapshot));
  }

  private resolveTitle(key: string | undefined): string {
    const brand = this.translateOrFallback('app.title', 'ArinPark');
    const page = key ? this.translateOrFallback(key) : '';

    return page && page !== brand ? `${page} | ${brand}` : brand;
  }

  private translateOrFallback(key: string, fallback = ''): string {
    const translated = this.translations.translate(key);
    return translated === `[${key}]` ? fallback : translated;
  }
}
