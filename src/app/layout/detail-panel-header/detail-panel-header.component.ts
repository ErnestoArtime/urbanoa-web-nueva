import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-detail-panel-header',
  imports: [RouterLink],
  template: `
    <div class="detail-panel-header">
      @if (backRoute()) {
        <a [routerLink]="backRoute()" class="back-btn" [class.back-desktop]="backDesktop()">←</a>
      }
      <h2 class="header-title">{{ title() }}</h2>
      <div class="header-actions">
        @if (showAttach()) {
          <button type="button" class="icon-btn" aria-label="Adjuntar">
            <svg viewBox="0 -960 960 960" width="20" height="20"><path d="M450-80q-88 0-149-63t-61-151v-430q0-65 46-110.5T397-880q65 0 111 45.5T554-724v410q0 38-26.5 65T463-222q-38 0-64.5-27T372-314v-370q0-13 8.5-21.5T402-714q13 0 21.5 8.5T432-684v370q0 12 8.5 20.5T461-285q12 0 20.5-8.5T490-314v-410q0-39-27.5-67T397-819q-39 0-66 28t-27 67v430q0 62 43 106t103 44q60 0 103-44t43-106v-400q0-13 8.5-21.5T626-714q13 0 21.5 8.5T656-684v400q0 88-61 151T450-80Z" fill="currentColor"/></svg>
          </button>
        }
        @if (showMore()) {
          <button type="button" class="icon-btn" aria-label="Más opciones">
            <svg viewBox="0 -960 960 960" width="20" height="20"><path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z" fill="currentColor"/></svg>
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host{display:block}.detail-panel-header{display:flex;align-items:center;gap:.5rem;padding:.75rem 1rem;background:var(--color-surface);position:sticky;top:0;z-index:10}.header-title{flex:1;font-size:var(--text-md);font-weight:var(--font-extra);margin:0}.back-btn{text-decoration:none;color:var(--color-primary);font-size:1.2rem;line-height:1;padding:0;display:grid;place-items:center;width:32px;height:32px;border-radius:50%;transition:background .15s}.back-btn:hover{background:var(--color-active)}.back-desktop{display:none}@media(min-width:960px){.back-desktop{display:grid}}.header-actions{display:flex;gap:.25rem}.icon-btn{background:none;border:none;padding:6px;cursor:pointer;color:var(--color-text-muted);border-radius:50%;display:grid;place-items:center;transition:background .15s,color .15s;width:32px;height:32px}.icon-btn:hover{background:var(--color-active);color:var(--color-text)}
    `,
  ],
})
export class DetailPanelHeaderComponent {
  readonly backRoute = input<string>();
  readonly title = input.required<string>();
  readonly showAttach = input(false);
  readonly showMore = input(false);
  readonly backDesktop = input(false);
}
