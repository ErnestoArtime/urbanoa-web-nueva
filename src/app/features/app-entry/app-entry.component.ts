import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ParkingSessionService } from '../../core/services/parking-session.service';

@Component({
  selector: 'app-entry',
  template: '',
})
export class AppEntryComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly parkingSessionService = inject(ParkingSessionService);

  ngOnInit(): void {
    const target = this.parkingSessionService.hasActiveParkings() ? '/app/home' : '/app/parking';
    void this.router.navigate([target], { replaceUrl: true });
  }
}
