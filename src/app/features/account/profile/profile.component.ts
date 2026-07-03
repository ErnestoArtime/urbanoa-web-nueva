import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, type UserData } from '../../../core/services/user.service';

@Component({
  selector: 'app-account-profile',
  imports: [RouterLink, FormsModule],
  template: `
    @if (!saved()) {
      <div class="page">
        <form #profileForm="ngForm" (ngSubmit)="save()">
          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input class="form-input" [(ngModel)]="form.name" name="name" #name="ngModel" required />
            @if (name.invalid && (name.dirty || name.touched)) {
              <span class="form-error">El nombre es obligatorio</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label">Primer apellido</label>
            <input class="form-input" [(ngModel)]="form.surname" name="surname" #surname="ngModel" required />
            @if (surname.invalid && (surname.dirty || surname.touched)) {
              <span class="form-error">El apellido es obligatorio</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label">NIF</label>
            <input class="form-input" [(ngModel)]="form.nif" name="nif" #nif="ngModel" required />
            @if (nif.invalid && (nif.dirty || nif.touched)) {
              <span class="form-error">El NIF es obligatorio</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input class="form-input" [(ngModel)]="form.phone" name="phone" #phone="ngModel" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" [(ngModel)]="form.email" name="email" #email="ngModel" required email />
            @if (email.invalid && (email.dirty || email.touched)) {
              @if (email.errors?.['required']) { <span class="form-error">El email es obligatorio</span> }
              @if (email.errors?.['email']) { <span class="form-error">Email no válido</span> }
            }
          </div>
          <button type="submit" class="btn btn-primary btn-block" [disabled]="profileForm.invalid">Guardar</button>
        </form>
        <a routerLink="/app/account/change-password" class="btn btn-ghost btn-block mt-1">Cambiar contraseña</a>
      </div>
    } @else {
      <div class="page text-center">
        <div class="success-icon">✓</div>
        <h1 class="page-title">Perfil guardado</h1>
        <p class="page-subtitle">Los datos de tu perfil se han actualizado correctamente.</p>
        <a routerLink="/app/home" class="btn btn-primary btn-block mt-2">Volver al inicio</a>
      </div>
    }
  `,
})
export class AccountProfileComponent {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly saved = signal(false);

  form: UserData = {
    name: this.userService.user().name,
    surname: this.userService.user().surname,
    email: this.userService.user().email,
    nif: this.userService.user().nif,
    phone: this.userService.user().phone,
  };

  save(): void {
    this.userService.updateUser({ ...this.form });
    this.saved.set(true);
  }
}
