import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MOCK_MUNICIPIOS } from '../../../shared/mock-data';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-support',
  imports: [TranslatePipe],
  template: `
    <div class="page account-static-page has-sticky-actions">
      <h1 class="page-title">{{ 'account.support.title' | translate }}</h1>
      <div class="card">
        <div class="form-group"><label>{{ 'account.support.category' | translate }} <span class="text-error">*</span></label>
          <select class="form-input" [value]="category()" (change)="category.set($any($event.target).value)">
            <option value="">{{ 'account.support.selectCategory' | translate }}</option>
            @for (c of categories; track c) { <option [value]="c">{{ c | translate }}</option> }
          </select>
        </div>
        <div class="form-group"><label>{{ 'account.support.municipio' | translate }}</label>
          <select class="form-input" [value]="municipio()" (change)="municipio.set($any($event.target).value)">
            <option value="">{{ 'account.support.selectMunicipio' | translate }}</option>
            @for (m of municipios; track m.id) { <option [value]="m.id">{{ m.nombre }}</option> }
            <option value="generic">{{ 'account.support.generic' | translate }}</option>
          </select>
        </div>
        <div class="form-group"><label>{{ 'account.support.plate' | translate }}</label><input class="form-input" [placeholder]="'account.support.plate' | translate" /></div>
        <div class="form-group"><label>{{ 'account.support.message' | translate }} <span class="text-error">*</span></label><textarea class="form-input" rows="4" [placeholder]="'account.support.messagePlaceholder' | translate"></textarea></div>
        <div class="sticky-actions">
          <button class="btn btn-primary btn-block" (click)="submit()">{{ 'account.support.send' | translate }}</button>
        </div>
      </div>
      @if (success()) { <div class="toast">{{ 'account.support.success' | translate }}</div> }
      @if (error()) { <div class="toast error">{{ 'account.support.requiredFields' | translate }}</div> }
    </div>
  `,
  styles: ['.toast{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);padding:.65rem 1.25rem;border-radius:999px;background:var(--color-primary-dark);color:#fff;z-index:2000}.toast.error{background:var(--color-error)}'],
})
export class AccountSupportComponent {
  private readonly router = inject(Router);
  readonly categories = ['account.support.suggestion', 'account.support.praise', 'account.support.complaint'];
  readonly municipios = MOCK_MUNICIPIOS;
  readonly category = signal('');
  readonly municipio = signal('');
  readonly success = signal(false);
  readonly error = signal(false);

  submit(): void {
    if (!this.category()) { this.error.set(true); return; }
    void this.router.navigate(['/app/account/support-success']);
  }
}
