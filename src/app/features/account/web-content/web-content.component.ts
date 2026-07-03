import { Component, inject, input, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-web-content',
  standalone: true,
  template: `
    <div class="web-content-page">
      @if (loading()) {
        <div class="web-state" role="status"><span class="loading-ring" aria-hidden="true"></span><span>Cargando {{ title().toLowerCase() }}…</span></div>
      } @else if (error()) {
        <div class="web-state"><p>No se pudo cargar el contenido.</p><button type="button" class="btn btn-secondary btn-sm" (click)="loadContent()">Reintentar</button></div>
      } @else {
        <article class="web-document" [innerHTML]="content()"></article>
      }
    </div>
  `,
  styles: [`
    :host{display:block;height:100%;min-height:0}.web-content-page{width:100%;height:100%;min-height:0;overflow-y:auto;overflow-x:hidden;padding:1rem 1.25rem;background:var(--color-background);scrollbar-width:thin;scrollbar-color:#879994 transparent}.web-content-page::-webkit-scrollbar{width:7px;height:7px}.web-content-page::-webkit-scrollbar-track{background:transparent}.web-content-page::-webkit-scrollbar-thumb{background:#879994;border:2px solid transparent;border-radius:999px;background-clip:padding-box}.web-state{height:100%;display:flex;align-items:center;justify-content:center;gap:.7rem;color:var(--color-text-muted);text-align:center}.loading-ring{width:24px;height:24px;border:3px solid var(--color-border);border-top-color:var(--color-primary);border-radius:50%;animation:spin .75s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
    :host ::ng-deep .web-document{max-width:980px;margin:0 auto;color:var(--color-text);font-family:Nunito,'Segoe UI',system-ui,sans-serif;font-size:.9rem;line-height:1.55}:host ::ng-deep .web-document h1{margin:0 0 1rem!important;padding:1rem 1.15rem!important;border-radius:var(--radius-md);background:var(--color-primary)!important;color:#fff!important;font-family:inherit!important;font-size:1.35rem!important}:host ::ng-deep .web-document h2{margin:.2rem 0!important;color:var(--color-primary-dark)!important;font-family:inherit!important;font-size:1.05rem!important}:host ::ng-deep .web-document section{margin-bottom:1rem;padding:1rem!important;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);font-family:inherit!important}:host ::ng-deep .web-document p{margin:.4rem 0 1.15rem!important;color:var(--color-text)!important;font-family:inherit!important}:host ::ng-deep .web-document ul{padding-left:1.25rem}:host ::ng-deep .web-document .container{display:flex;align-items:center;gap:.75rem;margin-top:1rem;padding:.7rem .85rem;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface)}:host ::ng-deep .web-document .container:first-child{margin-top:0}:host ::ng-deep .web-document .container::before{content:'?';display:grid;place-items:center;flex:0 0 38px;width:38px;height:38px;border:2px solid var(--color-primary);border-radius:50%;background:transparent;color:var(--color-primary);font-size:1.45rem;font-weight:700}:host ::ng-deep .web-document img{display:none!important}@media(max-width:767px){.web-content-page{padding:.75rem}:host ::ng-deep .web-document h1{font-size:1.1rem!important}:host ::ng-deep .web-document section{padding:.75rem!important}}
  `],
})
export class WebContentComponent implements OnInit {
  readonly title = input.required<string>();
  readonly url = input.required<string>();
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly content = signal<SafeHtml>('');
  private readonly sanitizer = inject(DomSanitizer);

  ngOnInit(): void { void this.loadContent(); }

  async loadContent(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      const path = new URL(this.url()).pathname;
      const response = await fetch(`/external-content${path}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const source = await response.text();
      const document = new DOMParser().parseFromString(source, 'text/html');
      document.querySelectorAll('script,style,link,meta,title').forEach(node => node.remove());
      document.querySelectorAll('[style]').forEach(node => node.removeAttribute('style'));
      document.querySelectorAll('img').forEach(image => image.remove());
      this.content.set(this.sanitizer.bypassSecurityTrustHtml(document.body.innerHTML));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
