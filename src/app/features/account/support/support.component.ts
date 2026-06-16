import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-account-support',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Soporte</h1>
      <div class="form-group"><label class="form-label">Categoría</label><select class="form-input"><option>Sugerencia</option><option>Reclamación</option></select></div>
      <div class="form-group"><label class="form-label">Ciudad</label><input class="form-input" value="Bilbao" /></div>
      <div class="form-group"><label class="form-label">Matrícula</label><input class="form-input" placeholder="1234 ABC" /></div>
      <div class="form-group"><label class="form-label">Mensaje</label><textarea class="form-input" rows="4"></textarea></div>
      <a routerLink="/app/account/support-success" class="btn btn-primary btn-block">Enviar</a>
    </div>
  `,
})
export class AccountSupportComponent {}
