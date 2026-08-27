import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ParkingSessionService } from '../../core/services/parking-session.service';

@Component({
  selector: 'app-entry',
  template: `<div class="entry-loading" role="status" aria-live="polite">Cargando…</div>`,
  styles: `
    :host { display: grid; min-height: 100%; place-items: center; }
    .entry-loading { color: var(--color-text-muted); font-size: var(--text-base); }
  `,
})
export class AppEntryComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly parkingSessionService = inject(ParkingSessionService);

  ngOnInit(): void {
    const target = this.parkingSessionService.hasActiveParkings() ? '/app/home' : '/app/parking';
    void this.router.navigate([target], { replaceUrl: true });
  }
}
