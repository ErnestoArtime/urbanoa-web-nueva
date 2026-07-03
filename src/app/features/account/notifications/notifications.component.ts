import { Component, signal } from '@angular/core';

interface NotificationOption { id: string; label: string; enabled: boolean; }

@Component({
  selector: 'app-account-notifications',
  template: `
    <div class="page notifications-page">
      <p class="page-subtitle">Configura los avisos que quieres recibir.</p>

      <section class="notification-section">
        <h2>Notificaciones de la aplicación</h2>
        @for (item of appNotifications(); track item.id) {
          <button type="button" class="switch-row" (click)="toggle('app', item.id)">
            <span>{{ item.label }}</span><span class="switch" [class.on]="item.enabled"></span>
          </button>
        }
      </section>

      <section class="notification-section">
        <div class="section-heading">
          <div><h2>Correo electrónico</h2><p>Se enviarán a la dirección asociada a tu cuenta.</p></div>
          <span class="email-chip">juan@ejemplo.com</span>
        </div>
        @for (item of emailNotifications(); track item.id) {
          <button type="button" class="switch-row" (click)="toggle('email', item.id)">
            <span>{{ item.label }}</span><span class="switch" [class.on]="item.enabled"></span>
          </button>
        }
      </section>

      <button class="btn btn-primary btn-block" type="button">Guardar cambios</button>
    </div>
  `,
  styles: [`
    .notifications-page { max-width:760px; }
    .notification-section { margin-bottom:1rem; padding:.25rem 1rem; border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); }
    .notification-section h2 { padding:.85rem 0 .35rem; font-size:.9rem; }
    .notification-section p { color:var(--color-text-muted); font-size:.76rem; }
    .switch-row { width:100%; border:0; border-top:1px solid var(--color-border); background:transparent; color:inherit; text-align:left; }
    .section-heading { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding-bottom:.7rem; }
    .email-chip { padding:.25rem .5rem; border-radius:999px; background:var(--color-accent-soft); color:var(--color-primary-dark); font-size:.72rem; }
  `],
})
export class AccountNotificationsComponent {
  readonly appNotifications = signal<NotificationOption[]>([
    { id: 'parking-end', label: 'Estacionamiento próximo a finalizar', enabled: true },
    { id: 'fine', label: 'Aviso de denuncia', enabled: true },
    { id: 'top-up', label: 'Confirmación de recarga', enabled: true },
  ]);
  readonly emailNotifications = signal<NotificationOption[]>([
    { id: 'receipt', label: 'Justificante de estacionamiento', enabled: true },
    { id: 'parking-end', label: 'Estacionamiento próximo a finalizar', enabled: false },
    { id: 'fine', label: 'Aviso de denuncia', enabled: false },
    { id: 'top-up', label: 'Confirmación de recarga', enabled: false },
  ]);

  toggle(channel: 'app' | 'email', id: string): void {
    const target = channel === 'app' ? this.appNotifications : this.emailNotifications;
    target.update(items => items.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item));
  }
}
