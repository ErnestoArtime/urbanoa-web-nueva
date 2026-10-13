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
  styleUrl: './web-content.component.css',
  standalone: true,
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
    const path =
      contentType === 'help'
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
