import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ActiveParking } from '../../../core/services/operations.service';
import { ParkingTicketCardComponent } from './parking-ticket-card.component';

describe('ParkingTicketCardComponent', () => {
  const parking = (refundable: 0 | 1 | 2 | undefined): ActiveParking => ({
    id: 'parking-1',
    plate: '1234ABC',
    vehicleId: 'vehicle-1',
    zone: 'Z2 AZUL',
    startTime: '15:30',
    durationLabel: '60 min',
    timeRemaining: '00:45:00',
    endTime: '16:30',
    refundable,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ParkingTicketCardComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
  });

  it('shows the unpark button only when refundable is 2', async () => {
    const fixture = TestBed.createComponent(ParkingTicketCardComponent);
    fixture.componentRef.setInput('parking', parking(2));

    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.btn-danger')).not.toBeNull();
  });

  for (const refundable of [0, 1, undefined] as const) {
    it(`hides the unpark button when refundable is ${String(refundable)}`, async () => {
      const fixture = TestBed.createComponent(ParkingTicketCardComponent);
      fixture.componentRef.setInput('parking', parking(refundable));

      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.btn-danger')).toBeNull();
    });
  }
});
