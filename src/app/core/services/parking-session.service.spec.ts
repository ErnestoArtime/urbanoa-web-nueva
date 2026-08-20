import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ParkingSessionService } from './parking-session.service';

describe('ParkingSessionService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('urbanoa.operations.active', '[]');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient()] });
  });

  it('does not start a second active parking for the same vehicle', () => {
    const service = TestBed.inject(ParkingSessionService);
    const input = {
      id: 'parking-1',
      plate: '1234 ABC',
      vehicleId: 'vehicle-1',
      zone: 'Centro',
      startTime: '10:00',
      durationLabel: '1 h',
      timeRemaining: '01:00:00',
      endTime: '11:00',
      amount: 1,
    };

    expect(service.startParking(input)).toBeTruthy();
    expect(service.startParking({ ...input, id: 'parking-2' })).toBeNull();
    expect(service.activeParkings().length).toBe(1);
  });

  it('counts every active parking from different vehicles', () => {
    const service = TestBed.inject(ParkingSessionService);
    const parking = {
      id: 'parking-1',
      plate: '1234 ABC',
      vehicleId: 'vehicle-1',
      zone: 'Centro',
      startTime: '10:00',
      durationLabel: '1 h',
      timeRemaining: '01:00:00',
      endTime: '11:00',
      amount: 1,
    };

    service.startParking(parking);
    service.startParking({ ...parking, id: 'parking-2', plate: '5678 DEF', vehicleId: 'vehicle-2' });

    expect(service.activeParkingsCount()).toBe(2);
  });
});
