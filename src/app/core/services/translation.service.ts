import { Injectable, signal } from '@angular/core';

export type SupportedLang = 'es' | 'eu' | 'fr' | 'uk';

const DEFAULT_LANG: SupportedLang = 'es';
const STORAGE_KEY = 'urbanoa-lang';
const SUPPORTED_LANGS: SupportedLang[] = ['es', 'eu', 'fr', 'uk'];
const TRANSLATION_FETCH_OPTIONS: RequestInit = { cache: 'no-store' };

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly currentLang = signal<SupportedLang>(DEFAULT_LANG);
  private readonly translations = signal<Record<string, string>>({});
  readonly translations$ = this.translations.asReadonly();
  readonly currentLang$ = this.currentLang.asReadonly();

  async setLang(lang: SupportedLang): Promise<void> {
    const targetLang = this.isSupportedLang(lang) ? lang : DEFAULT_LANG;
    const data = await this.loadTranslations(targetLang);

    this.currentLang.set(targetLang);
    this.translations.set(data);
    localStorage.setItem(STORAGE_KEY, targetLang);
    document.documentElement.lang = targetLang;
  }

  translate(key: string, params?: Record<string, string | number>): string {
    let value = this.translations()[key] ?? `[${key}]`;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replaceAll(`{{${k}}}`, String(v));
      }
    }
    return value;
  }

  translateLabel(value?: string | null): string {
    const trimmed = value?.trim();
    if (!trimmed) return '';
    return this.translations()[trimmed] ?? trimmed;
  }

  init(): void {
    const saved = this.getSavedLang();
    const initialLang = saved ?? this.detectBrowserLang() ?? DEFAULT_LANG;
    void this.setLang(initialLang);
  }

  private getSavedLang(): SupportedLang | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return this.isSupportedLang(saved) ? saved : null;
    } catch {
      return null;
    }
  }

  private detectBrowserLang(): SupportedLang | null {
    const candidates = [...(navigator.languages ?? []), navigator.language].filter(Boolean);

    for (const candidate of candidates) {
      const normalized = candidate.toLowerCase();
      const matched = SUPPORTED_LANGS.find((lang) => normalized === lang || normalized.startsWith(`${lang}-`));
      if (matched) {
        return matched;
      }
    }

    return null;
  }

  private isSupportedLang(value: string | null | undefined): value is SupportedLang {
    return value === 'es' || value === 'eu' || value === 'fr' || value === 'uk';
  }

  private async loadTranslations(lang: SupportedLang): Promise<Record<string, string>> {
    try {
      const response = await fetch(`/assets/i18n/${lang}.json`, TRANSLATION_FETCH_OPTIONS);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${lang}`);
      }
      return (await response.json()) as Record<string, string>;
    } catch {
      if (lang !== DEFAULT_LANG) {
        const fallbackResponse = await fetch(`/assets/i18n/${DEFAULT_LANG}.json`, TRANSLATION_FETCH_OPTIONS);
        return (await fallbackResponse.json()) as Record<string, string>;
      }
      return {};
    }
  }
}
