import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MOCK_USER } from '../../../shared/mock-data';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { UserService } from '../../../core/services/user.service';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-account-profile',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header [title]="'account.profile.title' | translate" backRoute="/app/account" />
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
        <app-result-modal
          type="success"
          [title]="'account.profile.saveSuccess' | translate"
          primaryText="Aceptar"
          (primaryAction)="saved.set(false)"
        />
      }
    </div>
  `,
  styles: [':host{display:block}'],
})
export class AccountProfileComponent {
  readonly saved = signal(false);
  readonly saving = signal(false);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    nif: [''],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.form.patchValue(this.userService.user());
  }

  onSave(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    setTimeout(() => {
      const raw = this.form.getRawValue();
      const data = { name: raw.name || '', surname: raw.surname || '', email: raw.email || '', nif: raw.nif || '', phone: raw.phone || '' };
      Object.assign(MOCK_USER, data);
      this.userService.updateUser(data);
      this.saving.set(false);
      this.saved.set(true);
    }, 1500);
  }
}
