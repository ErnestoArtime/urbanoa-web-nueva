import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile-progress-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="card profile-progress-card">
      <div class="profile-progress-head"><span>Configuración de la cuenta</span><strong>{{ progress() }}%</strong></div>
      <div class="profile-progress"><span [style.width.%]="progress()"></span></div>
      <p class="card-title">Completa tu perfil</p>
      <p class="card-subtitle">Revisa tus datos y activa la ubicación para mostrar automáticamente las zonas de estacionamiento más cercanas.</p>
      <div class="row mt-1">
        <a routerLink="/app/account/profile" class="btn btn-primary btn-sm">Revisar perfil</a>
        <a routerLink="/onboarding/location" class="btn btn-secondary btn-sm">Ubicación</a>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border-radius: 12px;
      border: 1px solid #d4d9cd;
      box-shadow: 0 1px 0 rgba(28, 44, 39, 0.04), 0 3px 8px rgba(28, 44, 39, 0.07);
      background: #f8f9f2;
      padding: 0.8rem 0.9rem;
    }
    .card-title { font-size: 1.02rem; margin-bottom: 0.15rem; }
    .profile-progress-card {
      background:#f7f8f1;
    }
    .profile-progress-head { display:flex; justify-content:space-between; color:var(--color-text-muted); font-size:.72rem; }
    .profile-progress { height:6px; margin:.45rem 0 .8rem; overflow:hidden; border-radius:999px; background:var(--color-border); }
    .profile-progress span { display:block; height:100%; background:var(--color-primary-light); }
  `],
})
export class ProfileProgressCardComponent {
  readonly progress = input(0);
  readonly completeProfile = output<void>();
}
