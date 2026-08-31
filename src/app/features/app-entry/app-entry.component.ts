import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OperationsService } from '../../core/services/operations.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-entry',
  imports: [LoaderComponent, TranslatePipe],
  template: `<app-loader [visible]="true" [message]="'common.loading' | translate" imageSrc="/assets/brand/login-logo.jpg" />`,
})
export class AppEntryComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly operationsService = inject(OperationsService);
  private readonly vehicleService = inject(VehicleService);

  async ngOnInit(): Promise<void> {
    const operationsLoad = this.operationsService.load();
    await this.vehicleService.load();
    const vehicles = this.vehicleService.vehicles();

    if (vehicles.length === 0) {
      void operationsLoad.catch(() => undefined);
      void this.router.navigate(['/app/home'], { replaceUrl: true });
      return;
    }

    await operationsLoad;
    const hasActiveParking = await this.operationsService.findFirstActiveParking(vehicles);

    const target = hasActiveParking ? '/app/home' : '/app/parking';
    void this.router.navigate([target], { replaceUrl: true });
  }
}
