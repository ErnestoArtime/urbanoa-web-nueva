import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vehicle-add',
  imports: [FormsModule],
  template: `
    <div class="page">
      <h1 class="page-title">Añadir vehículo</h1>
      <form #vehicleForm="ngForm" (ngSubmit)="save()">
        <div class="form-group">
          <label class="form-label">Matrícula</label>
          <input class="form-input" placeholder="1234 ABC" [(ngModel)]="form.plate" name="plate" #plate="ngModel" required />
          @if (plate.invalid && (plate.dirty || plate.touched)) {
            <span class="form-error">La matrícula es obligatoria</span>
          }
        </div>
        <label><input type="checkbox" [(ngModel)]="form.isForeign" name="isForeign" /> Matrícula extranjera</label>
        <label class="mt-1" style="display:block"><input type="checkbox" [(ngModel)]="form.isDefault" name="isDefault" /> Marcar como vehículo favorito</label>
        <button type="submit" class="btn btn-primary btn-block mt-2" [disabled]="vehicleForm.invalid">Guardar</button>
      </form>
    </div>
  `,
})
export class VehicleAddComponent {
  form = {
    plate: '',
    isForeign: false,
    isDefault: false,
  };

  save(): void {
    // TODO: implement vehicle save logic
  }
}
