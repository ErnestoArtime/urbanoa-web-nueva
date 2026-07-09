import { Component, input, output } from '@angular/core';

export type ResultType = 'success' | 'error' | 'warning' | 'confirmation';

@Component({
  selector: 'app-result-modal',
  template: `
    <div class="result-modal-overlay">
      <div class="result-modal">
        <div
          class="result-icon"
          [class.success]="type() === 'success'"
          [class.error]="type() === 'error'"
          [class.warning]="type() === 'warning' || type() === 'confirmation'"
        >
          @if (type() === 'success') {
            <svg
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          } @else if (type() === 'error') {
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          } @else {
            <svg
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          }
        </div>
        <h2 class="result-title">{{ title() }}</h2>
        @if (message(); as msg) {
          <p class="result-message">{{ msg }}</p>
        }
        <div class="result-actions">
          <button type="button" class="btn btn-primary btn-block" (click)="primaryAction.emit()">
            {{ primaryText() }}
          </button>
          @if (secondaryText(); as text) {
            <button type="button" class="btn btn-ghost btn-block mt-1" (click)="secondaryAction.emit()">
              {{ text }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .result-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: grid;
        place-items: center;
        z-index: 3000;
        padding: 1rem;
      }
      .result-modal {
        background: #fff;
        border-radius: 20px;
        padding: 2rem 1.5rem 1.5rem;
        max-width: 340px;
        width: 100%;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
      }
      .result-icon {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
      }
      .result-icon.success {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .result-icon.error {
        background: #fbe9e7;
        color: #c62828;
      }
      .result-icon.warning {
        background: #fbe9e7;
        color: #c62828;
      }
      .result-title {
        font-size: var(--text-lg);
        font-weight: var(--font-bold);
        margin: 0 0 0.35rem;
      }
      .result-message {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        margin: 0 0 1.25rem;
      }
      .result-actions {
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class ResultModalComponent {
  readonly type = input.required<ResultType>();
  readonly title = input.required<string>();
  readonly message = input<string>();
  readonly primaryText = input.required<string>();
  readonly secondaryText = input<string>();
  readonly primaryAction = output<void>();
  readonly secondaryAction = output<void>();
}
