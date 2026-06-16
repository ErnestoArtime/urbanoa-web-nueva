import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-account-tax-data',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Datos fiscales</h1>
      <div class="form-group"><label class="form-label">NIF</label><input class="form-input" /></div>
      <div class="form-group"><label class="form-label">Calle</label><input class="form-input" /></div>
      <div class="row">
        <div class="form-group" style="flex:1"><label class="form-label">Número</label><input class="form-input" /></div>
        <div class="form-group" style="flex:1"><label class="form-label">Piso</label><input class="form-input" /></div>
      </div>
      <div class="form-group"><label class="form-label">Ciudad</label><input class="form-input" /></div>
      <div class="form-group"><label class="form-label">Provincia</label><input class="form-input" /></div>
      <div class="form-group"><label class="form-label">Código postal</label><input class="form-input" /></div>
      <a routerLink="/app/account" class="btn btn-primary btn-block">Guardar</a>
    </div>
  `,
})
export class AccountTaxDataComponent {}
