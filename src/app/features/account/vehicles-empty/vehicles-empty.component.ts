import { Component } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-vehicles-empty',
  imports: [TranslatePipe],
  template: `<div class="split-view-detail-empty"><p>{{ 'account.vehicles.empty' | translate }}</p></div>`,
})
export class VehiclesEmptyComponent {}
