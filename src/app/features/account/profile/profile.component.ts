import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MOCK_USER } from '../../../shared/mock-data';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';

@Component({
  selector: 'app-account-profile',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, DetailPanelHeaderComponent],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.profile.title' | translate }}</h1>
      <form [formGroup]="form" (ngSubmit)="onSave()">
        <div class="card">
          <div class="form-group">
            <label>{{ 'account.profile.name' | translate }}</label
            ><input class="form-input" formControlName="name" [placeholder]="'account.profile.name' | translate" />
          </div>
          <div class="form-group">
            <label>{{ 'account.profile.surname' | translate }}</label
            ><input class="form-input" formControlName="surname" [placeholder]="'account.profile.surname' | translate" />
          </div>
          <div class="form-group">
            <label>{{ 'account.profile.nif' | translate }}</label
            ><input class="form-input" formControlName="nif" [placeholder]="'account.profile.nif' | translate" />
          </div>
          <div class="form-group">
            <label>{{ 'account.profile.phone' | translate }}</label
            ><input class="form-input" formControlName="phone" [placeholder]="'account.profile.phone' | translate" />
          </div>
          <div class="form-group">
            <label>{{ 'account.profile.email' | translate }}</label
            ><input class="form-input" type="email" formControlName="email" [placeholder]="'account.profile.email' | translate" />
          </div>
          <button type="submit" class="btn btn-primary btn-block" [disabled]="saving()">
            {{ saving() ? ('common.saving' | translate) : ('common.save' | translate) }}
          </button>
        </div>
      </form>
      <a routerLink="/app/account/change-password" class="btn btn-secondary btn-block mt-2">{{
        'account.menu.changePassword' | translate
      }}</a>
      @if (saved()) {
        <div class="toast">{{ 'account.profile.saveSuccess' | translate }}</div>
      }
    </div>
  `,
  styles: [
    '.toast{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);padding:.65rem 1.25rem;border-radius:999px;background:var(--color-primary-dark);color:#fff;z-index:2000}',
  ],
})
export class AccountProfileComponent {
  readonly saved = signal(false);
  readonly saving = signal(false);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    nif: [''],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.form.patchValue(MOCK_USER);
  }

  onSave(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    setTimeout(() => {
      Object.assign(MOCK_USER, this.form.value);
      this.saving.set(false);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 3000);
    }, 1500);
  }
}
