import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-account-tax-data',
  imports: [RouterLink, FormsModule],
  template: `
    @if (!saved()) {
      <div class="page">
        <form #taxForm="ngForm" (ngSubmit)="save()">
          <div class="form-group">
            <label class="form-label">NIF</label>
            <input class="form-input" [(ngModel)]="form.nif" name="nif" #nif="ngModel" required />
            @if (nif.invalid && (nif.dirty || nif.touched)) {
              <span class="form-error">El NIF es obligatorio</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label">Calle</label>
            <input class="form-input" [(ngModel)]="form.street" name="street" #street="ngModel" required />
            @if (street.invalid && (street.dirty || street.touched)) {
              <span class="form-error">La calle es obligatoria</span>
            }
          </div>
          <div class="row">
            <div class="form-group" style="flex:1">
              <label class="form-label">Número</label>
              <input class="form-input" [(ngModel)]="form.number" name="number" #number="ngModel" required />
              @if (number.invalid && (number.dirty || number.touched)) {
                <span class="form-error">Obligatorio</span>
              }
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">Piso</label>
              <input class="form-input" [(ngModel)]="form.floor" name="floor" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Ciudad</label>
            <input class="form-input" [(ngModel)]="form.city" name="city" #city="ngModel" required />
            @if (city.invalid && (city.dirty || city.touched)) {
              <span class="form-error">La ciudad es obligatoria</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label">Provincia</label>
            <input class="form-input" [(ngModel)]="form.province" name="province" #province="ngModel" required />
            @if (province.invalid && (province.dirty || province.touched)) {
              <span class="form-error">La provincia es obligatoria</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label">Código postal</label>
            <input class="form-input" [(ngModel)]="form.zip" name="zip" #zip="ngModel" required />
            @if (zip.invalid && (zip.dirty || zip.touched)) {
              <span class="form-error">El código postal es obligatorio</span>
            }
          </div>
          <button type="submit" class="btn btn-primary btn-block" [disabled]="taxForm.invalid">Guardar</button>
        </form>
      </div>
    } @else {
      <div class="page text-center">
        <div class="success-icon">✓</div>
        <h1 class="page-title">Datos fiscales guardados</h1>
        <p class="page-subtitle">Los datos fiscales se han actualizado correctamente.</p>
        <a routerLink="/app/home" class="btn btn-primary btn-block mt-2">Volver al inicio</a>
      </div>
    }
  `,
})
export class AccountTaxDataComponent {
  readonly saved = signal(false);

  form = {
    nif: '',
    street: '',
    number: '',
    floor: '',
    city: '',
    province: '',
    zip: '',
  };

  save(): void {
    this.saved.set(true);
  }
}
