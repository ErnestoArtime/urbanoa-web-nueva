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
  private selectionController?: AbortController;
  readonly pendingLang = signal<SupportedLang | null>(null);
  readonly failedLang = signal<SupportedLang | null>(null);
  readonly translations$ = this.translations.asReadonly();
  readonly currentLang$ = this.currentLang.asReadonly();

  async setLang(lang: SupportedLang): Promise<void> {
    if (!this.isSupportedLang(lang)) return;
    const version = ++this.loadVersion;
    this.selectionController?.abort();
    const controller = new AbortController();
    this.selectionController = controller;
    this.pendingLang.set(lang);
    this.failedLang.set(null);
    try {
      const data = await this.loadTranslations(lang, controller.signal);
      if (version !== this.loadVersion) return;
      this.translations.set(data);
      this.currentLang.set(lang);
      this.catalogueLoaded = true;
      this.refreshAttempted = false;
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // A blocked preference store must not prevent changing the active language.
      }
      document.documentElement.lang = lang === 'uk' ? 'en' : lang;
    } catch {
      if (version === this.loadVersion) this.failedLang.set(lang);
    } finally {
      if (version === this.loadVersion) this.pendingLang.set(null);
    }
  }

  translate(key: string, params?: Record<string, string | number>): string {
    if (key && this.translations()[key] === undefined && this.catalogueLoaded && !this.pendingLang() && !this.refreshAttempted) {
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
      if (normalized === 'en' || normalized.startsWith('en-')) return 'uk';
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

  private async loadTranslations(lang: SupportedLang, signal?: AbortSignal): Promise<Record<string, string>> {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (signal?.aborted) throw new Error('Language selection superseded');
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal?.addEventListener('abort', abort, { once: true });
      const timeout = setTimeout(abort, 5_000);
      try {
        const response = await fetch(`/assets/i18n/${lang}.json`, { ...TRANSLATION_FETCH_OPTIONS, signal: controller.signal });
        if (!response.ok) throw new Error(`Failed to load translations for ${lang}`);
        const data: unknown = await response.json();
        if (
          !data ||
          typeof data !== 'object' ||
          Array.isArray(data) ||
          !Object.keys(data).length ||
          Object.values(data).some((value) => typeof value !== 'string')
        ) {
          throw new Error(`Invalid catalogue for ${lang}`);
        }
        return data as Record<string, string>;
      } catch (error) {
        if (signal?.aborted || attempt === 2) throw error;
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', abort);
      }
    }
    throw new Error(`Failed to load translations for ${lang}`);
  }
}
