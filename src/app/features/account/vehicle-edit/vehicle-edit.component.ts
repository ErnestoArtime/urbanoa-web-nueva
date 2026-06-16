import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_VEHICLES } from '../../../shared/mock-data';

@Component({
  selector: 'app-vehicle-edit',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Editar vehículo</h1>
      <div class="form-group"><label class="form-label">Matrícula</label><input class="form-input" [value]="vehicle.plate" /></div>
      <label><input type="checkbox" [checked]="vehicle.isDefault" /> Marcar como vehículo favorito</label>
      <a routerLink="/app/account/vehicles" class="btn btn-primary btn-block mt-2">Guardar</a>
      <button type="button" class="btn btn-ghost btn-block mt-1" style="color:var(--color-error)">Eliminar vehículo</button>
    </div>
  `,
})
export class VehicleEditComponent {
  readonly vehicle = MOCK_VEHICLES[0];
}
