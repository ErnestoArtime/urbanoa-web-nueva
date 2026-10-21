import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ParkingApiService } from '../../../core/services/parking-api.service';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingTicketsComponent } from './tickets.component';
import { SupportedLang, TranslationService } from '../../../core/services/translation.service';

describe('ParkingTicketsComponent', () => {
  it('reloads tariffs after a confirmed language change and discards a late previous-language result', async () => {
    const language = signal<SupportedLang>('es');
    const parkingApi = jasmine.createSpyObj<ParkingApiService>('ParkingApiService', ['tickets', 'opsDate', 'serverNow']);
    let finishSpanish!: (value: Awaited<ReturnType<ParkingApiService['tickets']>>) => void;
    parkingApi.tickets.and.returnValue(
      new Promise((resolve) => {
        finishSpanish = resolve;
      }),
    );
    parkingApi.serverNow.and.returnValue(new Date());
    parkingApi.opsDate.and.returnValue('120000211026');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ParkingApiService, useValue: parkingApi },
        { provide: TranslationService, useValue: { currentLang$: language } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ plate: '1234ABC' }) } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ParkingTicketsComponent());
    const initialLoad = component.ngOnInit();
    await TestBed.inject(ApplicationRef).whenStable();
    parkingApi.tickets.and.resolveTo({ data: [{ id: '2', name: 'Tarif français', desc: '', price: '' }], source: 'remote' });
    language.set('fr');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(parkingApi.tickets).toHaveBeenCalledTimes(2);
    expect(component.tariffs()[0].name).toBe('Tarif français');
    finishSpanish({ data: [{ id: '1', name: 'Tarifa española', desc: '', price: '' }], source: 'remote' });
    await initialLoad;
    expect(component.tariffs()[0].name).toBe('Tarif français');
  });
  for (const origin of ['streets', 'map', undefined]) {
    it(`returns to the selection origin ${origin ?? '(missing)'} with the current city and vehicle`, async () => {
      const params = {
        city: 'durango',
        cityId: '23',
        cityName: 'Durango',
        vehicleId: 'vehicle-1',
        plate: '1234ABC',
        ...(origin ? { selectionOrigin: origin } : {}),
      };
      TestBed.configureTestingModule({
        imports: [ParkingTicketsComponent],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(params) } } },
          { provide: TranslationService, useValue: { translate: (key: string) => key, currentLang$: () => 'es' } },
          {
            provide: ParkingApiService,
            useValue: {
              tickets: async () => ({ data: [{ id: '1', schedule: 'L - V 9:00\nSábado 9:00\n<b>Texto</b>', informationalOnly: true }] }),
              serverNow: () => new Date(),
              opsDate: () => '120000141026',
            },
          },
        ],
      });
      const fixture = TestBed.createComponent(ParkingTicketsComponent);
      await fixture.whenStable();
      const link = fixture.nativeElement.querySelector('.back-link') as HTMLAnchorElement;
      expect(link.pathname).toBe(origin === 'streets' ? '/app/parking/streets' : '/app/parking');
      expect(link.textContent?.trim()).toBe(origin === 'streets' ? 'parking.streets.back' : 'parking.tickets.back');
      const query = new URL(link.href).searchParams;
      expect(query.get('city')).toBe('durango');
      expect(query.get('cityId')).toBe('23');
      expect(query.get('cityName')).toBe('Durango');
      expect(query.get('plate')).toBe('1234ABC');
      expect(query.get('vehicleId')).toBe('vehicle-1');
      const schedule = fixture.nativeElement.querySelector('.ticket-schedule') as HTMLElement;
      expect(schedule.textContent).toBe('L - V 9:00\nSábado 9:00\n<b>Texto</b>');
      expect(schedule.querySelector('b')).toBeNull();
      expect(getComputedStyle(schedule).whiteSpace).toBe('pre-line');
      const store = TestBed.inject(ParkingFlowStore);
      store.update({ cityId: '23', zoneId: '1', sectorId: '2', plate: '5678DEF', vehicleId: 'vehicle-2' });
      await fixture.whenStable();
      expect(new URL(link.href).searchParams.get('plate')).toBe('5678DEF');
      expect(link.pathname).toBe(origin === 'streets' ? '/app/parking/streets' : '/app/parking');
    });
  }

  it('carries the selected tariff sector into navigation and the shared payment state like the APK', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: ParkingApiService, useValue: {} },
      ],
    });
    const store = TestBed.inject(ParkingFlowStore);
    store.update({ cityId: '3', zoneId: '10', sectorId: '100', zoneName: 'Old zone', sectorName: 'Old sector', plate: '1234ABC' });
    const component = TestBed.runInInjectionContext(() => new ParkingTicketsComponent());
    const tariff = { id: '7', name: 'Visitor', desc: '', price: '', zoneId: 20, sectorId: 200, zoneName: 'Zone B', sectorName: 'Sector B' };
    expect(component.withTariff(tariff)).toEqual(
      jasmine.objectContaining({ sectorId: '200', zoneId: '20', zone: 'Zone B', sector: 'Sector B' }),
    );
    component.onSelectTariff(tariff);
    expect(store.fromStore()).toEqual(jasmine.objectContaining({ sectorId: '200', zoneId: '20', zone: 'Zone B', sector: 'Sector B' }));
  });

  it('reloads tariffs with the newly selected plate', async () => {
    const parkingApi = jasmine.createSpyObj<ParkingApiService>('ParkingApiService', ['tickets', 'opsDate', 'serverNow']);
    parkingApi.tickets.and.resolveTo({ data: [], source: 'remote' });
    parkingApi.serverNow.and.returnValue(new Date(2026, 7, 28, 12, 0));
    parkingApi.opsDate.and.returnValue('120000280826');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ParkingFlowStore,
        { provide: ParkingApiService, useValue: parkingApi },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });
    const store = TestBed.inject(ParkingFlowStore);
    store.update({
      cityId: '3',
      zoneId: '10002',
      street: 'Z_2_AZUL_03',
      streetId: '2401',
      sectorId: '22002',
      vehicleId: '1234567',
      plate: '1234567',
    });
    const component = TestBed.runInInjectionContext(() => new ParkingTicketsComponent());
    await component.ngOnInit();

    store.selectVehicle('56789AB', '56789AB');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(parkingApi.tickets).toHaveBeenCalledTimes(2);
    expect(parkingApi.tickets.calls.mostRecent().args[0].plate).toBe('56789AB');
  });
});
