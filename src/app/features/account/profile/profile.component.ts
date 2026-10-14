import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { UserService } from '../../../core/services/user.service';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-account-profile',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent, LoaderComponent],
  template: `
    <app-loader [visible]="saving()" [message]="'common.loading' | translate" />
    <div class="page account-static-page account-form-page">
      <app-detail-panel-header [title]="'account.profile.title' | translate" backRoute="/app/account" />
      <form [formGroup]="form" (ngSubmit)="onSave()">
        <div class="card">
          <div class="form-group">
            <label for="profile-field-1">{{ 'account.profile.name' | translate }} <span aria-hidden="true">*</span></label
            ><input id="profile-field-1" class="form-input" formControlName="name" [placeholder]="'account.profile.name' | translate" />
            @if (form.controls.name.touched && form.controls.name.invalid) {
              <p class="form-error">{{ 'account.profile.nameRequired' | translate }}</p>
            }
          </div>
          <div class="form-group">
            <label for="profile-field-2">{{ 'account.profile.surname' | translate }} <span aria-hidden="true">*</span></label
            ><input
              id="profile-field-2"
              class="form-input"
              formControlName="surname"
              [placeholder]="'account.profile.surname' | translate"
            />
            @if (form.controls.surname.touched && form.controls.surname.invalid) {
              <p class="form-error">{{ 'account.profile.surnameRequired' | translate }}</p>
            }
          </div>
          <div class="form-group">
            <label for="profile-field-3">{{ 'account.profile.secondSurname' | translate }}</label
            ><input
              id="profile-field-3"
              class="form-input"
              formControlName="secondSurname"
              [placeholder]="'account.profile.secondSurname' | translate"
            />
          </div>
          <div class="form-group">
            <label for="profile-field-4">{{ 'account.profile.nif' | translate }} <span aria-hidden="true">*</span></label
            ><input id="profile-field-4" class="form-input" formControlName="nif" [placeholder]="'account.profile.nif' | translate" />
            @if (form.controls.nif.touched && form.controls.nif.invalid) {
              <p class="form-error">{{ 'account.profile.nifRequired' | translate }}</p>
            }
          </div>
          <div class="form-group">
            <label for="profile-field-5">{{ 'account.profile.phone' | translate }} <span aria-hidden="true">*</span></label
            ><input id="profile-field-5" class="form-input" formControlName="phone" [placeholder]="'account.profile.phone' | translate" />
            @if (form.controls.phone.touched && form.controls.phone.invalid) {
              <p class="form-error">{{ 'common.required' | translate }}</p>
            }
          </div>
          <div class="form-group">
            <label for="profile-field-6">{{ 'account.profile.email' | translate }} <span aria-hidden="true">*</span></label
            ><input
              id="profile-field-6"
              class="form-input"
              type="email"
              formControlName="email"
              [placeholder]="'account.profile.email' | translate"
            />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <p class="form-error">
                {{
                  form.controls.email.hasError('email')
                    ? ('account.profile.emailInvalid' | translate)
                    : ('account.profile.emailRequired' | translate)
                }}
              </p>
            }
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
          [primaryText]="'common.accept' | translate"
          (primaryAction)="saved.set(false)"
        />
      }
      @if (saveFailed()) {
        <app-result-modal
          type="error"
          [title]="'account.profile.saveError' | translate"
          [message]="'account.profile.saveErrorDetail' | translate"
          [primaryText]="'common.accept' | translate"
          (primaryAction)="saveFailed.set(false)"
        />
      }
    </div>
  `,
  styleUrl: './profile.component.css',
})
export class AccountProfileComponent {
  readonly saved = signal(false);
  readonly saving = signal(false);
  readonly saveFailed = signal(false);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    secondSurname: [''],
    nif: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.form.patchValue(this.userService.user());
    effect(() => {
      const user = this.userService.user();
      untracked(() => {
        if (this.saving()) return;
        for (const key of Object.keys(this.form.controls) as (keyof typeof this.form.controls)[]) {
          const control = this.form.controls[key];
          if (control.pristine) control.setValue(user[key], { emitEvent: false });
        }
      });
    });
  }

  async onSave(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    try {
      const result = await this.userService.save(this.form.getRawValue());
      if (result.success) {
        this.saved.set(true);
      } else {
        this.saveFailed.set(true);
      }
    } catch {
      this.saveFailed.set(true);
    } finally {
      this.saving.set(false);
    }
  }
}
