import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-parking-city-info',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Bilbao</h1>
      <p class="page-subtitle">Zona azul y aparcamiento regulado</p>
      <div class="card mt-2">
        <p>Horario: L-V 9:00–14:00 y 16:00–20:00</p>
        <p class="text-muted mt-1">Tarifa rotación: 0,60 €/h</p>
      </div>
      <a routerLink="/app/parking/streets" class="btn btn-primary btn-block mt-2">Buscar calle</a>
    </div>
  `,
})
export class ParkingCityInfoComponent {}
