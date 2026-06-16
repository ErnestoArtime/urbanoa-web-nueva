import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-vehicle-add',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Añadir vehículo</h1>
      <div class="form-group"><label class="form-label">Matrícula</label><input class="form-input" placeholder="1234 ABC" /></div>
      <label><input type="checkbox" /> Matrícula extranjera</label>
      <label class="mt-1" style="display:block"><input type="checkbox" /> Marcar como vehículo favorito</label>
      <a routerLink="/app/account/vehicles" class="btn btn-primary btn-block mt-2">Guardar</a>
    </div>
  `,
})
export class VehicleAddComponent {}
