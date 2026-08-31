import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OperationsService } from '../../core/services/operations.service';
import { ParkingSessionService } from '../../core/services/parking-session.service';
import { VehicleService } from '../../core/services/vehicle.service';

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
  private readonly operationsService = inject(OperationsService);
  private readonly parkingSessionService = inject(ParkingSessionService);
  private readonly vehicleService = inject(VehicleService);

  async ngOnInit(): Promise<void> {
    await Promise.all([this.operationsService.load(), this.vehicleService.load()]);
    await this.operationsService.loadDashboardParkingStatuses(this.vehicleService.vehicles());

    const target = this.parkingSessionService.hasActiveParkings() ? '/app/home' : '/app/parking';
    void this.router.navigate([target], { replaceUrl: true });
  }
}
