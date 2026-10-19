import { TranslatePipe } from '../../pipes/translate.pipe';
import { Component, input, output } from '@angular/core';
import { LoaderComponent } from '../loader/loader.component';

export type ResultType = 'success' | 'error' | 'warning' | 'confirmation' | 'delete' | 'unpark';

@Component({
  selector: 'app-result-modal',
  imports: [LoaderComponent, TranslatePipe],
  template: `
    <app-loader [visible]="busy()" [message]="'common.loading' | translate" />
    <div class="result-modal-overlay">
      <div class="result-modal" role="dialog" aria-modal="true" [attr.aria-label]="title()">
        <div
          class="result-icon"
          aria-hidden="true"
          [class.success]="type() === 'success' || type() === 'unpark'"
          [class.error]="type() === 'error'"
          [class.warning]="type() === 'warning'"
          [class.confirmation]="type() === 'confirmation'"
          [class.delete]="type() === 'delete'"
        >
          @if (type() === 'success' || type() === 'unpark') {
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
          } @else if (type() === 'warning') {
            <svg
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              stroke-width="2.3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.9 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          } @else if (type() === 'delete') {
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
              <path d="M8 6V4h8v2" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v5M14 11v5" />
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
              <path d="M4 9h16" />
              <path d="M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
              <path d="M8 13h5" />
              <path d="m15 11 2 2-2 2" />
            </svg>
          }
        </div>
        <h2 class="result-title">{{ title() }}</h2>
        @if (message(); as msg) {
          <p class="result-message">{{ msg }}</p>
        }
        <div class="result-actions">
          <button type="button" class="btn btn-primary btn-block" [disabled]="busy()" (click)="primaryAction.emit()">
            {{ primaryText() }}
          </button>
          @if (secondaryText(); as text) {
            <button type="button" class="btn btn-ghost btn-block mt-1" [disabled]="busy()" (click)="secondaryAction.emit()">
              {{ text }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './result-modal.component.css',
})
export class ResultModalComponent {
  readonly busy = input(false);
  readonly type = input.required<ResultType>();
  readonly title = input.required<string>();
  readonly message = input<string>();
  readonly primaryText = input.required<string>();
  readonly secondaryText = input<string>();
  readonly primaryAction = output<void>();
  readonly secondaryAction = output<void>();
}
