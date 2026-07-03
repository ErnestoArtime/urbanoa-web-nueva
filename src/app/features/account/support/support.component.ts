import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MOCK_MUNICIPIOS } from '../../../shared/mock-data';

const SUPPORT_CATEGORIES = ['Sugerencia', 'Felicitación', 'Queja'];
const MAX_MESSAGE_LENGTH = 500;

@Component({
  selector: 'app-account-support',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="form-group">
        <label class="form-label">Categoría <span class="required">*</span></label>
        <select class="form-input" [(ngModel)]="category">
          <option value="">Seleccionar categoría</option>
          @for (c of categories; track c) {
            <option [value]="c">{{ c }}</option>
          }
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Municipio <span class="required">*</span></label>
        <select class="form-input" [(ngModel)]="city">
          <option value="">Seleccionar municipio</option>
          @for (m of cities; track m.id) {
            <option [value]="m.nombre">{{ m.nombre }}</option>
          }
          <option value="Genérico">Genérico</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Matrícula</label>
        <input class="form-input" [(ngModel)]="plate" placeholder="1234 ABC" />
      </div>
      <div class="form-group">
        <label class="form-label">Mensaje <span class="required">*</span></label>
        <textarea class="form-input" [(ngModel)]="message" rows="4" [maxLength]="maxLength" placeholder="Describe tu consulta…"></textarea>
        <span class="char-count">{{ message().length }} / {{ maxLength }}</span>
      </div>
      <button type="button" class="btn btn-primary btn-block mt-2" (click)="submit()" [disabled]="!isValid()">
        Enviar reporte
      </button>
      @if (submitted()) {
        <p class="success-msg">Reporte enviado correctamente.</p>
      }
      @if (showError()) {
        <p class="error-msg">Completa los campos obligatorios.</p>
      }
    </div>
  `,
  styles: [
    `
    .required { color:var(--color-error); }
    .char-count { display:block; text-align:right; font-size:.72rem; color:var(--color-text-muted); margin-top:.2rem; }
    .success-msg { color:var(--color-success); text-align:center; margin-top:.5rem; font-size:.85rem; }
    .error-msg { color:var(--color-error); text-align:center; margin-top:.5rem; font-size:.85rem; }
  `,
  ],
})
export class AccountSupportComponent {
  private readonly router = inject(Router);
  readonly categories = SUPPORT_CATEGORIES;
  readonly cities = MOCK_MUNICIPIOS;
  readonly maxLength = MAX_MESSAGE_LENGTH;
  readonly category = signal('');
  readonly city = signal('');
  readonly plate = signal('');
  readonly message = signal('');
  readonly submitted = signal(false);
  readonly showError = signal(false);

  readonly isValid = () => this.category() !== '' && this.city() !== '' && this.message().trim().length > 0;

  submit(): void {
    this.showError.set(false);
    if (!this.isValid()) {
      this.showError.set(true);
      return;
    }
    this.submitted.set(true);
    setTimeout(() => this.router.navigate(['/app/account/support-success']), 500);
  }
}
