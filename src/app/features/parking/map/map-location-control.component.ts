import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { Component, input, output } from '@angular/core';
import { LucideLoaderCircle, LucideMapPinOff } from '@lucide/angular';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

export type MapLocationState = 'idle' | 'locating' | 'located' | 'denied' | 'unavailable';

@Component({
  selector: 'app-map-location-control',
  imports: [AppIconComponent, LucideLoaderCircle, LucideMapPinOff, TranslatePipe],
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
          <app-icon name="myLocation" [size]="22" [stroke]="false" />
        }
      </button>
    </div>
  `,
  styleUrl: './map-location-control.component.css',
})
export class MapLocationControlComponent {
  readonly state = input.required<MapLocationState>();
  readonly locate = output<void>();
}
