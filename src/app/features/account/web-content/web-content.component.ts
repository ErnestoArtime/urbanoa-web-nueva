import { Component, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-web-content',
  imports: [TranslatePipe],
  template: `
    @if (loading()) {
      <p class="text-center text-muted">{{ 'account.webContent.loading' | translate:{title: title()} }}</p>
    }
    @if (error()) {
      <p class="text-center text-muted">{{ 'account.webContent.error' | translate }}</p>
    }
    <iframe #iframe [src]="sanitizedUrl()" (load)="onLoad()" (error)="onError()" style="width:100%;height:100%;border:0" title="{{ title() }}"></iframe>
  `,
  styles: [':host{display:block;height:100%;position:relative}'],
})
export class WebContentComponent {
  readonly url = input('https://arinpark.gerteksa.eus');
  readonly title = input('Contenido');
  readonly loading = signal(true);
  readonly error = signal(false);
  private readonly sanitizer = inject(DomSanitizer);

  sanitizedUrl() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.url());
  }

  onLoad(): void { this.loading.set(false); }
  onError(): void { this.error.set(true); this.loading.set(false); }
}
