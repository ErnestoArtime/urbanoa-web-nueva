import { Component, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { APP_BRAND } from '../../../shared/constants/app-brand';

@Component({
  selector: 'app-web-content',
  imports: [TranslatePipe],
  template: `
    @if (loading()) {
      <p class="text-center text-muted">{{ 'account.webContent.loading' | translate: { title: title() } }}</p>
    }
    @if (error()) {
      <div class="web-content-error">
        <p class="text-muted">{{ 'account.webContent.error' | translate }}</p>
        <a [href]="rawUrl" target="_blank" class="btn btn-primary btn-block mt-2">Abrir en navegador</a>
      </div>
    }
    @if (!error()) {
      <iframe
        #iframe
        [src]="sanitizedUrl()"
        (load)="onLoad()"
        (error)="onError()"
        style="width:100%;height:100%;border:0"
        title="{{ title() }}"
      ></iframe>
    }
  `,
  styles: [':host{display:block;height:100%;position:relative} .web-content-error{padding:2rem;text-align:center}'],
})
export class WebContentComponent {
  readonly brand = APP_BRAND;
  readonly url = input(`/external-content`);
  readonly title = input('Contenido');
  readonly loading = signal(true);
  readonly error = signal(false);
  private readonly sanitizer = inject(DomSanitizer);

  get rawUrl(): string {
    return this.url().startsWith('/external-content')
      ? `https://${this.brand.name.toLowerCase()}.gerteksa.eus${this.url().replace('/external-content', '')}`
      : this.url();
  }

  sanitizedUrl() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.url());
  }

  onLoad(): void {
    this.loading.set(false);
  }
  onError(): void {
    this.error.set(true);
    this.loading.set(false);
  }
}
