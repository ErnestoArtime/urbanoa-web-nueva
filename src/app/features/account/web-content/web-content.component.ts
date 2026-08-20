import { Component, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../core/services/translation.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-web-content',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="web-content-shell">
      <header class="web-content-header">
        <a [routerLink]="backLink() ?? '/app/account'" class="web-content-back">←</a>
        <h1 class="page-title">{{ resolvedTitle() }}</h1>
      </header>

      <section class="web-content-frame" [attr.aria-busy]="loading()">
        @if (loading()) {
          <div class="web-content-state">
            <span class="web-content-spinner" aria-hidden="true"></span>
            <p>{{ 'account.webContent.loading' | translate: { title: resolvedTitle() } }}</p>
          </div>
        }
        @if (error()) {
          <div class="web-content-error">
            <strong>{{ 'account.webContent.displayError' | translate }}</strong>
            <p class="text-muted">{{ 'account.webContent.error' | translate }}</p>
            <a [href]="rawUrl()" target="_blank" rel="noopener" class="btn btn-primary">{{
              'account.webContent.openBrowser' | translate
            }}</a>
          </div>
        } @else {
          <iframe [src]="iframeUrl()" (load)="onLoad()" (error)="onError()" [title]="resolvedTitle()" scrolling="yes"></iframe>
        }
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
        background: var(--color-background);
      }
      .web-content-shell {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        background: var(--color-background);
      }
      .web-content-header {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) 44px;
        align-items: center;
        min-height: var(--header-height);
        padding: 0 0.4rem;
        background: var(--color-background);
        border-bottom: 1px solid var(--color-border);
        flex-shrink: 0;
      }
      @media (max-width: 959px) {
        .web-content-header {
          display: none;
        }
      }
      .web-content-header h1 {
        display: block;
        grid-column: 2;
        overflow: hidden;
        margin: 0;
        font-size: var(--text-base);
        font-weight: var(--font-bold);
        line-height: var(--line-normal);
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .web-content-back,
      .web-content-open {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        color: var(--color-primary);
        border-radius: 50%;
        text-decoration: none;
      }
      .web-content-back:hover,
      .web-content-open:hover {
        background: var(--color-accent-soft);
        text-decoration: none;
      }
      .web-content-back span {
        margin-top: -0.15rem;
        font-size: var(--text-2xl);
        line-height: 1;
      }
      .web-content-open svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
      }
      .web-content-frame {
        position: relative;
        flex: 1;
        min-height: 0;
        overflow: hidden;
        overscroll-behavior: contain;
        touch-action: pan-x pan-y;
        background: #fff;
      }
      .web-content-frame iframe {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
        background: #fff;
        overscroll-behavior: contain;
        touch-action: pan-x pan-y;
      }
      .web-content-state,
      .web-content-error {
        position: absolute;
        inset: 0;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1.5rem;
        text-align: center;
        background: var(--color-background);
      }
      .web-content-state p,
      .web-content-error p {
        color: var(--color-text-muted);
      }
      .web-content-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid var(--color-border);
        border-top-color: var(--color-primary);
        border-radius: 50%;
        animation: web-content-spin 0.8s linear infinite;
      }
      @keyframes web-content-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (min-width: 960px) {
        .web-content-header {
          grid-template-columns: minmax(0, 1fr) 44px;
          min-height: 58px;
          padding-left: 1.1rem;
        }
        .web-content-header h1 {
          grid-column: 1;
          font-size: var(--text-lg);
          text-align: left;
        }
        .web-content-back,
        .web-content-header-space {
          display: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .web-content-spinner {
          animation: none;
        }
      }
    `,
  ],
})
export class WebContentComponent {
  private readonly translationService = inject(TranslationService);
  readonly url = input(environment.externalContentBaseUrl);
  readonly title = input('');
  readonly backLink = input<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);

  readonly resolvedTitle = computed(() => {
    const value = this.title() || this.route.snapshot.data['title'] || '';
    return value.includes('.') ? this.translationService.translate(value) : value;
  });
  readonly resolvedBackLink = computed(() => this.backLink() || this.route.snapshot.data['backLink'] || null);
  readonly resolvedUrl = computed(() => {
    const routeUrl = this.route.snapshot.data['url'];
    const contentType = this.route.snapshot.data['contentType'];
    const base = environment.externalContentBaseUrl;
    if (typeof contentType === 'string') return this.legalUrl(base, contentType);
    const value = this.url() === base && typeof routeUrl === 'string' ? routeUrl : this.url();
    return value.startsWith(base) ? `${environment.externalContentOrigin}${value.slice(base.length)}` : value;
  });

  private legalUrl(base: string, contentType: string): string {
    const language = this.translationService.currentLang$();
    const code = language === 'uk' ? 'en' : language === 'eu' ? 'eus' : language;
    const faq = { es: 'ESP', eu: 'EUS', fr: 'FRA', uk: 'ENG' }[language];
    const path = contentType === 'help'
      ? `/Arinpark/ArinparkFAQ-${faq}.html`
      : contentType === 'terms'
        ? `/arinpark/CU_${code}.html`
        : `/arinpark/${code}.html`;
    return `${environment.externalContentOrigin}${path}`;
  }

  readonly rawUrl = computed(() => this.resolvedUrl());

  readonly iframeUrl = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(this.resolvedUrl()));

  onLoad(): void {
    this.loading.set(false);
  }

  onError(): void {
    this.error.set(true);
    this.loading.set(false);
  }
}
