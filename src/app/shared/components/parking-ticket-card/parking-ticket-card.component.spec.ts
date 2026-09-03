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

  it('shows unparking and extension actions when refundable is not 0', async () => {
    const fixture = TestBed.createComponent(ParkingTicketCardComponent);
    fixture.componentRef.setInput('parking', parking(1));

    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.btn-danger')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.btn-primary')).not.toBeNull();
  });

  it('uses the parking sector color for the ticket header', async () => {
    const fixture = TestBed.createComponent(ParkingTicketCardComponent);
    fixture.componentRef.setInput('parking', { ...parking(undefined), sectorColor: '1E88E5' });

    await fixture.whenStable();

    const ticket = fixture.nativeElement.querySelector('.parking-ticket-card') as HTMLElement;
    expect(ticket.style.getPropertyValue('--ticket-header-color')).toBe('#1E88E5');
  });

  it('hides unparking and extension actions when refundable is 0', async () => {
    const fixture = TestBed.createComponent(ParkingTicketCardComponent);
    fixture.componentRef.setInput('parking', parking(0));

    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.btn-danger')).toBeNull();
    expect(fixture.nativeElement.querySelector('.btn-primary')).toBeNull();
  });
});
