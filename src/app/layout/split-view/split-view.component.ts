import { Component, input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-split-view',
  imports: [RouterOutlet, TranslatePipe],
  host: {
    class: 'split-view-host',
  },
  template: `
    <div class="split-view">
      <div class="split-view-list" [class.split-hidden]="hideList()">
        <ng-content select="[splitList]" />
      </div>
      <div class="split-view-detail" [class.split-hidden]="hideDetail()">
        @if (showOutlet()) {
          <router-outlet />
        } @else {
          <div class="split-view-detail-empty">
            <p>{{ emptyMessageKey() | translate }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
  `,
})
export class SplitViewComponent {
  hideList = input(false);
  hideDetail = input(false);
  showOutlet = input(true);
  emptyMessageKey = input('layout.splitView.empty');
}
