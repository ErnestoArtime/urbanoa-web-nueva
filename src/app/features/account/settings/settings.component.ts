import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  template: `
    <div class="page">
      <p class="page-subtitle">Opciones de seguridad</p>
      <div class="card">
        <div class="switch-row" (click)="toggleBiometric()">
          <span>Pedir huella para usar la app</span>
          <div class="switch" [class.on]="pendingBiometricEnabled()"></div>
        </div>
      </div>
      <button type="button" class="btn btn-primary btn-block mt-2" (click)="save()" [disabled]="saving()">
        {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
      </button>
    </div>

    @if (showPrompt()) {
      <div class="dialog-backdrop" (click)="cancelPrompt()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="dialog-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9zm3 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>
          </div>
          <p class="dialog-title">Confirmar identidad</p>
          <p class="dialog-desc">Autentícate para activar la huella.</p>
          <div class="dialog-actions">
            <button type="button" class="btn btn-ghost" (click)="cancelPrompt()">Cancelar</button>
            <button type="button" class="btn btn-primary" (click)="confirmPrompt()">Confirmar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
    .page-subtitle { color:var(--color-text-muted); font-size:.82rem; margin:-.4rem 0 .7rem; }
    .switch-row { display:flex; justify-content:space-between; align-items:center; padding:.65rem .75rem; cursor:pointer; }
    .switch-row span { font-size:.9rem; font-weight:600; }
    .switch { width:40px; height:22px; border-radius:99px; background:var(--color-border); transition:background .2s; position:relative; flex-shrink:0; }
    .switch.on { background:var(--color-primary); }
    .switch::after { content:''; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .2s; }
    .switch.on::after { transform:translateX(18px); }
    .dialog-backdrop { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.35); display:grid; place-items:center; padding:1.5rem; }
    .dialog { background:var(--color-surface); border-radius:var(--radius-lg); padding:1.5rem; max-width:340px; width:100%; text-align:center; }
    .dialog-icon { width:48px; height:48px; border-radius:50%; background:var(--color-accent-soft); display:grid; place-items:center; margin:0 auto .6rem; }
    .dialog-icon svg { width:26px; height:26px; fill:var(--color-primary); }
    .dialog-title { font-weight:700; font-size:1.05rem; margin-bottom:.25rem; }
    .dialog-desc { font-size:.85rem; color:var(--color-text-muted); }
    .dialog-actions { display:flex; gap:.7rem; margin-top:1rem; }
    .dialog-actions .btn { flex:1; }
  `,
  ],
})
export class AccountSettingsComponent {
  readonly biometricEnabled = signal(false);
  readonly pendingBiometricEnabled = signal(false);
  readonly showPrompt = signal(false);
  readonly saving = signal(false);

  toggleBiometric(): void {
    if (this.pendingBiometricEnabled()) {
      this.pendingBiometricEnabled.set(false);
    } else {
      this.showPrompt.set(true);
    }
  }

  cancelPrompt(): void {
    this.showPrompt.set(false);
  }

  confirmPrompt(): void {
    this.showPrompt.set(false);
    this.pendingBiometricEnabled.set(true);
  }

  save(): void {
    this.saving.set(true);
    this.biometricEnabled.set(this.pendingBiometricEnabled());
    setTimeout(() => this.saving.set(false), 600);
  }
}
