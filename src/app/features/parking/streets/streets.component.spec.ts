import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { CitiesService } from '../../../core/services/cities.service';
import { StreetsService } from '../../../core/services/streets.service';
import { TranslationService } from '../../../core/services/translation.service';
import { ParkingStreetsComponent } from './streets.component';

describe('ParkingStreetsComponent back navigation', () => {
  it('returns to municipalities while preserving the selected city and vehicle', async () => {
    TestBed.configureTestingModule({ imports: [ParkingStreetsComponent], providers: [
      provideZonelessChangeDetection(), provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ city: 'zarautz', cityName: 'Zarautz', plate: 'PKJ321', vehicleId: 'vehicle-1' }) } } },
      { provide: CitiesService, useValue: { contractIdFor: () => 3 } },
      { provide: StreetsService, useValue: { getStreets: async () => ({ data: [] }) } },
      { provide: TranslationService, useValue: { translate: (key: string) => key } },
    ] });
    const fixture = TestBed.createComponent(ParkingStreetsComponent);
    await fixture.whenStable();
    const link = fixture.nativeElement.querySelector('.back-link') as HTMLAnchorElement;
    expect(link.pathname).toBe('/app/parking/cities');
    const query = new URL(link.href).searchParams;
    expect(query.get('city')).toBe('zarautz');
    expect(query.get('vehicleId')).toBe('vehicle-1');
    expect(query.get('plate')).toBe('PKJ321');
  });
});
