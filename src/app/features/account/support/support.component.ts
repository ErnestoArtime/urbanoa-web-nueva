import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MOCK_MUNICIPIOS } from '../../../shared/mock-data';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-support',
  imports: [ReactiveFormsModule, TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    <div class="page account-static-page has-sticky-actions">
      <app-detail-panel-header [title]="'account.support.title' | translate" backRoute="/app/account" />
      <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="form-group">
          <label for="support-category">{{ 'account.support.category' | translate }} <span class="text-error">*</span></label>
          <select id="support-category" class="form-input" formControlName="category">
            <option value="">{{ 'account.support.selectCategory' | translate }}</option>
            @for (category of categories; track category) {
              <option [value]="category">{{ category | translate }}</option>
            }
          </select>
          @if (categoryControl.invalid && categoryControl.touched) {
            <p class="form-error">{{ 'validation.required' | translate }}</p>
          }
        </div>
        <div class="form-group">
          <label for="support-municipio">{{ 'account.support.municipio' | translate }}</label>
          <select id="support-municipio" class="form-input" formControlName="municipio">
            <option value="">{{ 'account.support.selectMunicipio' | translate }}</option>
            @for (municipio of municipios; track municipio.id) {
              <option [value]="municipio.id">{{ municipio.nombre }}</option>
            }
            <option value="generic">{{ 'account.support.generic' | translate }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="support-plate">{{ 'account.support.plate' | translate }}</label>
          <input id="support-plate" class="form-input" formControlName="plate" [placeholder]="'account.support.plate' | translate" />
          @if (plateControl.invalid && plateControl.touched) {
            <p class="form-error">{{ 'validation.plate' | translate }}</p>
          }
        </div>
        <div class="form-group">
          <label for="support-message">{{ 'account.support.message' | translate }} <span class="text-error">*</span></label>
          <textarea
            id="support-message"
            class="form-input"
            rows="4"
            formControlName="message"
            [placeholder]="'account.support.messagePlaceholder' | translate"
          ></textarea>
          @if (messageControl.invalid && messageControl.touched) {
            <p class="form-error">{{ 'validation.required' | translate }}</p>
          }
        </div>
        <div class="sticky-actions">
          <button type="submit" class="btn btn-primary btn-block">{{ 'account.support.send' | translate }}</button>
        </div>
      </form>
      @if (error()) {
        <app-result-modal
          type="error"
          [title]="'account.support.missingTitle' | translate"
          [message]="'account.support.requiredFields' | translate"
          [primaryText]="'account.support.reviewForm' | translate"
          (primaryAction)="error.set(false)"
        />
      }
    </div>
  `,
  styles: [':host{display:block}'],
})
export class AccountSupportComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly categories = ['account.support.suggestion', 'account.support.praise', 'account.support.complaint'];
  readonly municipios = MOCK_MUNICIPIOS;
  readonly error = signal(false);
  readonly form = this.fb.nonNullable.group({
    category: ['', Validators.required],
    municipio: [''],
    plate: ['', Validators.pattern(/^[0-9]{4}\s?[A-Z]{3}$|^[A-Z]{1,3}\s?[0-9]{1,4}\s?[A-Z]{1,3}$/i)],
    message: ['', Validators.required],
  });

  get categoryControl() {
    return this.form.controls.category;
  }

  get plateControl() {
    return this.form.controls.plate;
  }

  get messageControl() {
    return this.form.controls.message;
  }

  submit(): void {
    this.error.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(true);
      return;
    }
    void this.router.navigate(['/app/account/support-success']);
  }
}
