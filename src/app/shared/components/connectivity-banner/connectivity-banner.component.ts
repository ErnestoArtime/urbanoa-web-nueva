import { Component, inject } from '@angular/core';
import { ConnectivityService } from '../../../core/services/connectivity.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-connectivity-banner',
  imports: [TranslatePipe],
  template: `
    @if (!connectivity.online()) {
      <div class="connectivity-banner" role="status" aria-live="polite">
        <span class="connectivity-banner-text">{{ 'connectivity.offline' | translate }}</span>
        <button type="button" class="connectivity-banner-retry" [disabled]="connectivity.checking()" (click)="connectivity.verify()">
          {{ (connectivity.checking() ? 'connectivity.checking' : 'common.retry') | translate }}
        </button>
      </div>
    }
  `,
  styleUrl: './connectivity-banner.component.css',
})
export class ConnectivityBannerComponent {
  readonly connectivity = inject(ConnectivityService);
}
