import { Component, signal } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';

@Component({
  selector: 'app-account-change-password',
  imports: [TranslatePipe, DetailPanelHeaderComponent, ResultModalComponent],
  template: `
    <div class="page account-static-page">
      <app-detail-panel-header [title]="'account.changePassword.title' | translate" backRoute="/app/account" />
      <div class="card">
        <div class="form-group">
          <label>{{ 'account.changePassword.current' | translate }} <span class="text-error">*</span></label
          ><input class="form-input" type="password" (input)="current.set(valueOf($event))" />
        </div>
        <div class="form-group">
          <label>{{ 'account.changePassword.new' | translate }} <span class="text-error">*</span></label
          ><input class="form-input" type="password" (input)="next.set(valueOf($event))" /><small class="text-muted">{{ 'account.changePassword.minLength' | translate }}</small>
        </div>
        <div class="form-group">
          <label>{{ 'account.changePassword.confirm' | translate }} <span class="text-error">*</span></label
          ><input class="form-input" type="password" (input)="confirmation.set(valueOf($event))" />
        </div>
        <button type="button" class="btn btn-primary btn-block" (click)="save()">{{ 'common.save' | translate }}</button>
      </div>
      @if (result(); as state) {
        <app-result-modal [type]="state" [title]="state === 'success' ? 'Contraseña actualizada' : 'No se pudo actualizar la contraseña'"
          [message]="state === 'success' ? 'La contraseña se ha cambiado correctamente.' : errorMessage()"
          primaryText="Aceptar" (primaryAction)="result.set(null)" />
      }
    </div>
  `,
  styles: [':host{display:block}'],
})
export class AccountChangePasswordComponent {
  readonly current = signal('');
  readonly next = signal('');
  readonly confirmation = signal('');
  readonly result = signal<'success' | 'error' | null>(null);
  readonly errorMessage = signal('');

  valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  save(): void {
    if (!this.current() || this.next().length < 8 || this.next() !== this.confirmation()) {
      this.errorMessage.set(this.next() !== this.confirmation() ? 'Las contraseñas nuevas no coinciden.' : 'Completa los campos y usa al menos 8 caracteres.');
      this.result.set('error');
      return;
    }
    this.result.set('success');
  }
}
