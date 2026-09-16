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
  private loadVersion = 0;
  private catalogueLoaded = false;
  private refreshAttempted = false;
  readonly translations$ = this.translations.asReadonly();
  readonly currentLang$ = this.currentLang.asReadonly();

  async setLang(lang: SupportedLang): Promise<void> {
    const version = ++this.loadVersion;
    this.catalogueLoaded = false;
    this.refreshAttempted = false;
    const targetLang = this.isSupportedLang(lang) ? lang : DEFAULT_LANG;
    const data = await this.loadTranslations(targetLang);
    if (version !== this.loadVersion) return;

    this.currentLang.set(targetLang);
    this.translations.set(data);
    this.catalogueLoaded = true;
    localStorage.setItem(STORAGE_KEY, targetLang);
    document.documentElement.lang = targetLang;
  }

  translate(key: string, params?: Record<string, string | number>): string {
    if (key && this.translations()[key] === undefined && this.catalogueLoaded && !this.refreshAttempted) {
      void this.refreshCatalogue();
    }
    let value = this.translations()[key] ?? `[${key}]`;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replaceAll(`{{${k}}}`, String(v));
      }
    }
    return value;
  }

  private async refreshCatalogue(): Promise<void> {
    // One retry per language selection handles a tab opened before a deployment.
    this.refreshAttempted = true;
    const version = this.loadVersion;
    const language = this.currentLang();
    try {
      const data = await this.loadTranslations(language);
      if (version === this.loadVersion && Object.keys(data).length) this.translations.set(data);
    } catch {
      // Retain the working catalogue if the refresh is unavailable.
    }
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
