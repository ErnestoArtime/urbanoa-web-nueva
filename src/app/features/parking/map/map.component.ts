import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-parking-map',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title desktop-only">Aparcar</h1>
      <div class="map-placeholder mt-2">
        <span class="map-pin"></span>
        <span>Mapa (maqueta)</span>
        <a routerLink="/app/parking/streets" class="fab">Aparcar aquí</a>
      </div>
      <div class="row mt-2">
        <a routerLink="/app/parking/cities" class="btn btn-secondary btn-sm">Ciudades</a>
        <a routerLink="/app/parking/tickets" class="btn btn-secondary btn-sm">Tarifas</a>
      </div>
    </div>
  `,
  styles: `.desktop-only { display: none; } @media (min-width: 768px) { .desktop-only { display: block; } }`,
})
export class ParkingMapComponent {}
