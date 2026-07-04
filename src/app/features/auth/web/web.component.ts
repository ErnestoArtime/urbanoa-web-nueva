import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { APP_BRAND } from '../../../shared/constants/app-brand';

@Component({
  selector: 'app-web',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">{{ title }}</h1>
      <div class="card mt-2">
        <p>Contenido legal de {{ brand.name }}.</p>
        <p class="text-muted mt-1">Gertek — gestión de aparcamiento regulado.</p>
      </div>
      <a routerLink="/auth/login" class="btn btn-secondary btn-block mt-2">Cerrar</a>
    </div>
  `,
})
export class WebComponent {
  readonly brand = APP_BRAND;
  private readonly route = inject(ActivatedRoute);
  title = this.route.snapshot.paramMap.get('type') === 'privacy'
    ? 'Política de privacidad'
    : 'Términos y condiciones';
}
