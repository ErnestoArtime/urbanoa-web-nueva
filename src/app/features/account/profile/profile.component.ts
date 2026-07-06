import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_USER } from '../../../shared/mock-data';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-profile',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.profile.title' | translate }}</h1>
      <div class="card">
        <div class="form-group">
          <label>{{ 'account.profile.name' | translate }}</label
          ><input class="form-input" [placeholder]="'account.profile.name' | translate" [value]="user.name" />
        </div>
        <div class="form-group">
          <label>{{ 'account.profile.surname' | translate }}</label
          ><input class="form-input" [placeholder]="'account.profile.surname' | translate" [value]="user.surname" />
        </div>
        <div class="form-group">
          <label>{{ 'account.profile.nif' | translate }}</label
          ><input class="form-input" [placeholder]="'account.profile.nif' | translate" [value]="user.nif" />
        </div>
        <div class="form-group">
          <label>{{ 'account.profile.phone' | translate }}</label
          ><input class="form-input" [placeholder]="'account.profile.phone' | translate" [value]="user.phone" />
        </div>
        <div class="form-group">
          <label>{{ 'account.profile.email' | translate }}</label
          ><input class="form-input" type="email" [placeholder]="'account.profile.email' | translate" [value]="user.email" />
        </div>
        <button class="btn btn-primary btn-block">{{ 'common.save' | translate }}</button>
      </div>
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
  readonly user = MOCK_USER;
  readonly saved = signal(false);
}
