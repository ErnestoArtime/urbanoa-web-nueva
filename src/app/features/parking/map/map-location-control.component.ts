import { Component, input, output } from '@angular/core';
import { LucideLocateFixed, LucideLoaderCircle, LucideMapPinOff } from '@lucide/angular';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

export type MapLocationState = 'idle' | 'locating' | 'located' | 'denied' | 'unavailable';

@Component({
  selector: 'app-map-location-control',
  imports: [LucideLocateFixed, LucideLoaderCircle, LucideMapPinOff, TranslatePipe],
  template: `
    <div class="location-wrap" [class.has-message]="state() !== 'idle' && state() !== 'located'">
      @if (state() === 'locating') {
        <span class="location-message">{{ 'parking.map.location.searching' | translate }}</span>
      } @else if (state() === 'denied') {
        <span class="location-message error"><svg lucideMapPinOff size="15"></svg>{{ 'parking.map.location.denied' | translate }}</span>
      } @else if (state() === 'unavailable') {
        <span class="location-message error"
          ><svg lucideMapPinOff size="15"></svg>{{ 'parking.map.location.unavailable' | translate }}</span
        >
      }
      <button
        type="button"
        class="location-button"
        [class.active]="state() === 'located'"
        [disabled]="state() === 'locating'"
        (click)="locate.emit()"
        [attr.aria-label]="'parking.map.location.action' | translate"
      >
        @if (state() === 'locating') {
          <svg lucideLoaderCircle class="spinner" size="22"></svg>
        } @else {
          <svg lucideLocateFixed size="22"></svg>
        }
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        position: absolute;
        z-index: 520;
        top: 5.2rem;
        right: 1rem;
      }
      .location-wrap {
        display: flex;
        align-items: center;
        gap: 0.45rem;
      }
      .location-message {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        max-width: 245px;
        padding: 0.45rem 0.65rem;
        border-radius: var(--radius-pill);
        color: var(--color-primary-dark);
        background: rgba(249, 250, 239, 0.96);
        box-shadow: var(--shadow-sm);
        font-size: var(--text-xs);
        font-weight: var(--font-medium);
      }
      .location-message.error {
        color: var(--color-error);
      }
      .location-button {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border: 1px solid var(--color-border);
        border-radius: 15px;
        color: var(--color-primary);
        background: rgba(255, 255, 255, 0.97);
        box-shadow: var(--shadow-md);
        cursor: pointer;
      }
      .location-button.active {
        color: #fff;
        background: var(--color-primary);
        border-color: var(--color-primary);
      }
      .location-button:disabled {
        cursor: wait;
      }
      .spinner {
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (max-width: 600px) {
        :host {
          top: 1rem;
          right: 0.65rem;
        }
        .location-message {
          max-width: 190px;
        }
      }
    `,
  ],
})
export class MapLocationControlComponent {
  readonly state = input.required<MapLocationState>();
  readonly locate = output<void>();
}
