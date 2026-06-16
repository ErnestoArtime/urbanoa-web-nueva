import { Component, input } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-split-view',
  imports: [RouterOutlet],
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
            <p>Selecciona un elemento de la lista</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class SplitViewComponent {
  hideList = input(false);
  hideDetail = input(false);
  showOutlet = input(true);
}
