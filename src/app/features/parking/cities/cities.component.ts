import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { MOCK_MUNICIPIOS } from '../../../shared/mock-data';

@Component({
  selector: 'app-parking-cities',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page">
      <h1 class="page-title">{{ 'parking.selectMunicipio' | translate }}</h1>
      <label class="municipio-search">
        <span aria-hidden="true">⌕</span>
        <input type="search" [placeholder]="'parking.cities.searchPlaceholder' | translate" [value]="search()" (input)="updateSearch($event)" />
      </label>
      <div class="municipios-layout mt-2">
        <div class="municipios-grid">
          @for (m of filteredMunicipios(); track m.id) {
            <button type="button" class="municipio-card" [class.active]="selected().id === m.id" (click)="selected.set(m)">
              <div class="municipio-img">
                <img [src]="'assets/municipios/' + m.imagen" [alt]="'parking.cities.viewOf' | translate:{name: m.nombre}" />
                <span class="municipio-map-label">{{ m.nombre }}</span>
              </div>
              <div class="municipio-body">
                <p class="municipio-name">{{ m.nombre }}</p>
                <p class="municipio-provincia">{{ m.provincia }}</p>
                <p class="municipio-zonas">{{ m.zonas }} {{ 'parking.zones' | translate }}</p>
              </div>
            </button>
          } @empty {
            <p class="empty-result">{{ 'parking.cities.empty' | translate }}</p>
          }
        </div>
        <aside class="municipio-detail">
          <span class="detail-kicker">{{ 'parking.cities.selected' | translate }}</span>
          <h2>{{ selected().nombre }}</h2>
          <p>{{ 'parking.cities.zonesLabel' | translate:{count: '' + selected().zonas} }}</p>
          <h3>{{ 'parking.cities.streetsTitle' | translate }}</h3>
          <ul>
            <li><span>{{ 'parking.cities.centro' | translate }}</span><strong>{{ 'parking.cities.zonaAzul' | translate }}</strong></li>
            <li><span>{{ 'parking.cities.cascoHistorico' | translate }}</span><strong>{{ 'parking.cities.rotacion' | translate }}</strong></li>
            <li><span>{{ 'parking.cities.areaResidencial' | translate }}</span><strong>{{ 'parking.cities.residentes' | translate }}</strong></li>
          </ul>
          <a routerLink="/app/parking" [queryParams]="{city: selected().id}" class="btn btn-primary btn-block">{{ 'parking.cities.viewMap' | translate }}</a>
          <a routerLink="/app/parking/streets" [queryParams]="{municipio: selected().id}" class="btn btn-secondary btn-block">{{ 'parking.cities.viewStreets' | translate }}</a>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .municipios-layout { display:grid; gap:1rem; }
    .municipio-search { display:flex; align-items:center; gap:.65rem; width:min(100%, 520px); margin-top:1rem; padding:.7rem .9rem; border:1px solid var(--color-border); border-radius:999px; background:var(--color-surface); color:var(--color-primary); }
    .municipio-search:focus-within { border-color:var(--color-primary); box-shadow:0 0 0 3px rgba(43,103,103,.12); }
    .municipio-search input { width:100%; border:0; outline:0; background:transparent; color:var(--color-text); font:inherit; }
    .municipios-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:1rem; }
    .municipio-card { display:flex; flex-direction:column; padding:0; overflow:hidden; border:1px solid var(--color-border); border-radius:var(--radius, 12px); background:var(--color-surface); color:inherit; text-align:left; cursor:pointer; transition:box-shadow .2s; }
    .municipio-card:hover { box-shadow:0 4px 12px rgba(0,0,0,.1); }
    .municipio-card.active { border-color:var(--color-primary); box-shadow:0 0 0 2px rgba(43,103,103,.12); }
    .municipio-img { display:flex; position:relative; align-items:center; justify-content:center; min-height:100px; overflow:hidden; background:linear-gradient(145deg, #dce9df, #cbdedb); }
    .municipio-img img { width:100%; height:118px; object-fit:cover; filter:saturate(.72) contrast(.94); }
    .municipio-map-label { position:absolute; left:.6rem; bottom:.55rem; padding:.2rem .45rem; border-radius:4px; background:rgba(249,250,239,.9); color:var(--color-primary-dark); font-size:.78rem; font-weight:800; }
    .municipio-body { padding:.75rem; }
    .municipio-name { margin:0; font-size:1rem; font-weight:700; }
    .municipio-provincia { margin:.125rem 0 0; color:var(--color-muted, #6b7280); font-size:.8rem; }
    .municipio-zonas { margin:.25rem 0 0; color:var(--color-primary); font-size:.8rem; font-weight:600; }
    .municipio-detail { padding:1rem; border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); }
    .detail-kicker { color:var(--color-primary); font-size:.7rem; font-weight:800; text-transform:uppercase; letter-spacing:.06em; }
    .municipio-detail h2 { margin:.2rem 0; font-size:1.4rem; }
    .municipio-detail > p { color:var(--color-text-muted); }
    .municipio-detail h3 { margin:1.2rem 0 .4rem; font-size:.85rem; }
    .municipio-detail ul { margin:0 0 1rem; padding:0; list-style:none; }
    .municipio-detail li { display:flex; justify-content:space-between; gap:1rem; padding:.65rem 0; border-bottom:1px solid var(--color-border); font-size:.8rem; }
    .municipio-detail li strong { color:var(--color-primary); }
    .municipio-detail .btn + .btn { margin-top:.65rem; }
    .empty-result { grid-column:1/-1; padding:2rem; border:1px dashed var(--color-border); border-radius:var(--radius-md); color:var(--color-text-muted); text-align:center; }
    @media (min-width:640px) { .municipios-grid { grid-template-columns:repeat(3, 1fr); } }
    @media (min-width:1024px) {
      .municipios-layout { grid-template-columns:minmax(0, 1fr) 320px; align-items:start; }
      .municipio-detail { position:sticky; top:1rem; }
    }
  `],
})
export class ParkingCitiesComponent {
  readonly municipios = MOCK_MUNICIPIOS;
  readonly selected = signal(this.municipios[1]);
  readonly search = signal('');
  readonly filteredMunicipios = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('es');
    if (!query) return this.municipios;
    return this.municipios.filter((municipio) =>
      `${municipio.nombre} ${municipio.provincia}`.toLocaleLowerCase('es').includes(query),
    );
  });

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
}
