import { Component, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';

@Component({
  selector: 'app-account-settings',
  imports: [TranslatePipe, DetailPanelHeaderComponent],
  template: `
    <div class="page account-static-page">
      <h1 class="page-title">{{ 'account.settings.title' | translate }}</h1>
      <div class="card">
        <label class="switch-row"
          ><span>{{ 'account.settings.fingerprint' | translate }}</span
          ><input type="checkbox" [checked]="fingerprint()" (change)="toggleFingerprint()" /><span class="switch"></span
        ></label>
      </div>
      <button class="btn btn-primary btn-block mt-2">
        {{ saving() ? ('account.settings.saving' | translate) : ('account.settings.save' | translate) }}
      </button>
      @if (showConfirm()) {
        <div class="modal-overlay" (click)="showConfirm.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>{{ 'account.settings.confirmIdentity' | translate }}</h3>
            <p>{{ 'account.settings.authenticate' | translate }}</p>
            <button class="btn btn-primary btn-block" (click)="showConfirm.set(false)">{{ 'common.confirm' | translate }}</button>
            <button class="btn btn-ghost btn-block" (click)="showConfirm.set(false)">{{ 'common.cancel' | translate }}</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .switch-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.65rem 0;
        cursor: pointer;
      }
      .switch {
        position: relative;
        width: 44px;
        height: 24px;
        border-radius: 99px;
        background: var(--color-border);
        transition: background 0.2s;
      }
      .switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #fff;
        transition: left 0.2s;
      }
      input:checked + .switch {
        background: var(--color-primary);
      }
      input:checked + .switch::after {
        left: 22px;
      }
      .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.35);
      }
      .modal {
        width: min(100%, 380px);
        padding: 1.5rem;
        border-radius: 20px;
        background: var(--color-surface);
      }
    `,
  ],
})
export class AccountSettingsComponent {
  readonly fingerprint = signal(true);
  readonly saving = signal(false);
  readonly showConfirm = signal(false);
  toggleFingerprint(): void {
    this.fingerprint.update((v) => !v);
    this.showConfirm.set(true);
  }
}
