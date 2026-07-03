import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-account-change-password',
  imports: [FormsModule],
  template: `
    <div class="page">
      <form #passwordForm="ngForm" (ngSubmit)="save()">
        <div class="form-group">
          <label class="form-label">Contraseña actual</label>
          <input class="form-input" type="password" [(ngModel)]="form.currentPassword" name="currentPassword" #currentPassword="ngModel" required />
          @if (currentPassword.invalid && (currentPassword.dirty || currentPassword.touched)) {
            <span class="form-error">La contraseña actual es obligatoria</span>
          }
        </div>
        <div class="form-group">
          <label class="form-label">Nueva contraseña</label>
          <input class="form-input" type="password" [(ngModel)]="form.newPassword" name="newPassword" #newPassword="ngModel" required minlength="6" />
          @if (newPassword.invalid && (newPassword.dirty || newPassword.touched)) {
            @if (newPassword.errors?.['required']) { <span class="form-error">La nueva contraseña es obligatoria</span> }
            @if (newPassword.errors?.['minlength']) { <span class="form-error">Mínimo 6 caracteres</span> }
          }
        </div>
        <div class="form-group">
          <label class="form-label">Confirmar contraseña</label>
          <input class="form-input" type="password" [(ngModel)]="form.confirmPassword" name="confirmPassword" #confirmPassword="ngModel" required />
          @if (confirmPassword.invalid && (confirmPassword.dirty || confirmPassword.touched)) {
            <span class="form-error">Confirmar la contraseña es obligatorio</span>
          }
        </div>
        <button type="submit" class="btn btn-primary btn-block" [disabled]="passwordForm.invalid">Guardar</button>
      </form>
    </div>
  `,
})
export class AccountChangePasswordComponent {
  form = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  save(): void {
    // TODO: implement password change logic
  }
}
