import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile-progress-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="card profile-progress-card">
      <div class="profile-progress-head">
        <span>Configuración de la cuenta</span><strong>{{ progress() }}%</strong>
      </div>
      <div class="profile-progress"><span [style.width.%]="progress()"></span></div>
      <p class="card-title">Completa tu perfil</p>
      <p class="card-subtitle">
        Revisa tus datos y activa la ubicación para mostrar automáticamente las zonas de estacionamiento más cercanas.
      </p>
      <div class="row mt-1">
        <a routerLink="/app/account/profile" class="btn btn-primary btn-sm">Revisar perfil</a>
        <a routerLink="/onboarding/location" class="btn btn-secondary btn-sm">Ubicación</a>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-progress-card {
        background: #f7f8f1;
      }
      .profile-progress-head {
        display: flex;
        justify-content: space-between;
        color: var(--color-text-muted);
        font-size: var(--text-xs);
      }
      .profile-progress {
        height: 6px;
        margin: 0.45rem 0 0.8rem;
        overflow: hidden;
        border-radius: 999px;
        background: var(--color-border);
      }
      .profile-progress span {
        display: block;
        height: 100%;
        background: var(--color-primary-light);
      }
    `,
  ],
})
export class ProfileProgressCardComponent {
  readonly progress = input(0);
  readonly completeProfile = output<void>();
}
