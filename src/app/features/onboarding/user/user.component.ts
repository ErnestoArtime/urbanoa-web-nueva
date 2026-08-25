import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-onboarding-user',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <h1 class="page-title">{{ 'onboarding.user.title' | translate }}</h1>
      <p class="page-subtitle">{{ 'onboarding.user.subtitle' | translate }}</p>
      <form [formGroup]="form" (ngSubmit)="continue()">
        <div class="form-group">
          <label class="form-label">{{ 'account.profile.name' | translate }}</label
          ><input class="form-input" formControlName="name" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ 'account.profile.surname' | translate }}</label
          ><input class="form-input" formControlName="surname" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ 'onboarding.user.secondSurname' | translate }}</label
          ><input class="form-input" formControlName="secondSurname" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ 'account.profile.nif' | translate }}</label
          ><input class="form-input" formControlName="nif" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ 'account.profile.phone' | translate }}</label
          ><input class="form-input" type="tel" formControlName="phone" />
        </div>
        <button type="submit" class="btn btn-primary btn-block mt-2" [disabled]="saving()">
          {{ saving() ? ('common.saving' | translate) : ('onboarding.next' | translate) }}
        </button>
      </form>
      <a routerLink="/auth/login" class="btn btn-ghost btn-block mt-1">{{ 'common.cancel' | translate }}</a>
    </div>
  `,
})
export class OnboardingUserComponent implements OnInit {
  readonly saving = signal(false);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    secondSurname: [''],
    nif: [''],
    phone: [''],
  });

  async ngOnInit(): Promise<void> {
    this.form.patchValue(await this.userService.load());
  }

  async continue(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      await this.userService.save(this.form.getRawValue());
      await this.router.navigate(['/onboarding/payment']);
    } finally {
      this.saving.set(false);
    }
  }
}
