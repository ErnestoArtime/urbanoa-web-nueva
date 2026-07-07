import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MOCK_MUNICIPIOS } from '../../../shared/mock-data';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-account-support',
  imports: [TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    <div class="page account-static-page has-sticky-actions">
      <app-detail-panel-header [title]="'account.support.title' | translate" backRoute="/app/account" />
      <div class="card">
        <div class="form-group">
          <label>{{ 'account.support.category' | translate }} <span class="text-error">*</span></label>
          <select class="form-input" [value]="category()" (change)="category.set($any($event.target).value)">
            <option value="">{{ 'account.support.selectCategory' | translate }}</option>
            @for (c of categories; track c) {
              <option [value]="c">{{ c | translate }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label>{{ 'account.support.municipio' | translate }}</label>
          <select class="form-input" [value]="municipio()" (change)="municipio.set($any($event.target).value)">
            <option value="">{{ 'account.support.selectMunicipio' | translate }}</option>
            @for (m of municipios; track m.id) {
              <option [value]="m.id">{{ m.nombre }}</option>
            }
            <option value="generic">{{ 'account.support.generic' | translate }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ 'account.support.plate' | translate }}</label
          ><input class="form-input" [value]="plate()" (input)="plate.set($any($event.target).value)" [placeholder]="'account.support.plate' | translate" />
        </div>
        <div class="form-group">
          <label>{{ 'account.support.message' | translate }} <span class="text-error">*</span></label
          ><textarea class="form-input" rows="4" [value]="message()" (input)="message.set($any($event.target).value)" [placeholder]="'account.support.messagePlaceholder' | translate"></textarea>
          @if (submitted() && !message()) {
            <p class="form-error">{{ 'common.required' | translate }}</p>
          }
        </div>
        <div class="sticky-actions">
          <button class="btn btn-primary btn-block" (click)="submit()">{{ 'account.support.send' | translate }}</button>
        </div>
      </div>
      @if (error()) {
        <app-result-modal type="error" title="Faltan datos" [message]="'account.support.requiredFields' | translate"
          primaryText="Revisar formulario" (primaryAction)="error.set(false)" />
      }
    </div>
  `,
  styles: [':host{display:block}'],
})
export class AccountSupportComponent {
  private readonly router = inject(Router);
  readonly categories = ['account.support.suggestion', 'account.support.praise', 'account.support.complaint'];
  readonly municipios = MOCK_MUNICIPIOS;
  readonly category = signal('');
  readonly municipio = signal('');
  readonly plate = signal('');
  readonly message = signal('');
  readonly submitted = signal(false);
  readonly error = signal(false);

  submit(): void {
    this.submitted.set(true);
    if (!this.category() || !this.message()) {
      this.error.set(true);
      return;
    }
    void this.router.navigate(['/app/account/support-success']);
  }
}
