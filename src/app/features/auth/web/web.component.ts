import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebContentComponent } from '../../account/web-content/web-content.component';

@Component({
  selector: 'app-web',
  imports: [WebContentComponent],
  template: ` <app-web-content [title]="title" [url]="url" backLink="/auth/login" /> `,
  styles: `
    :host {
      display: block;
      height: 100dvh;
      min-height: 0;
    }
  `,
})
export class WebComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = this.route.snapshot.paramMap.get('type') === 'privacy' ? 'account.menu.privacy' : 'account.menu.terms';
  readonly url =
    this.route.snapshot.paramMap.get('type') === 'privacy' ? '/external-content/arinpark/es.html' : '/external-content/arinpark/CU_es.html';
}
