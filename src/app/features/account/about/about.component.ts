import { Component } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-about',
  imports: [TranslatePipe],
  template: `
    <div class="page account-static-page text-center">
      <h1 class="page-title">{{ 'app.title' | translate }}</h1>
      <p>{{ 'account.version' | translate }}</p>
      <p class="text-muted mt-1">{{ 'account.developedBy' | translate }}</p>
    </div>
  `,
  styles: [':host{display:block}'],
})
export class AccountAboutComponent {}
