import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { OpsSessionService } from '../../../core/api/ops-session.service';
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
  private readonly contentBase = environment.externalContentBaseUrl;
  private readonly session = inject(OpsSessionService);

  readonly title = this.route.snapshot.paramMap.get('type') === 'privacy' ? 'account.menu.privacy' : 'account.menu.terms';
  readonly url = this.session.token()
    ? `${environment.apiBaseUrl}/content/${this.route.snapshot.paramMap.get('type') ?? 'terms'}`
    : this.route.snapshot.paramMap.get('type') === 'privacy'
      ? `${this.contentBase}/arinpark/es.html`
      : `${this.contentBase}/arinpark/CU_es.html`;
}
