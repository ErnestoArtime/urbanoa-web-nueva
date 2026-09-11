import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { OperationsDetailComponent } from './detail.component';
import { OperationsService } from '../../../core/services/operations.service';
import { CitiesService } from '../../../core/services/cities.service';
import { TranslationService } from '../../../core/services/translation.service';
import { OperationType } from '../../../shared/models/operation-type';
import { Operation } from '../../../shared/models/operation';

describe('OperationsDetailComponent navigation', () => {
  const params = new BehaviorSubject(convertToParamMap({ id: 'first' }));
  const operations = signal<Operation[]>([]);
  const loadDetail = jasmine.createSpy('loadDetail').and.resolveTo(undefined);

  beforeEach(async () => {
    params.next(convertToParamMap({ id: 'first' }));
    loadDetail.calls.reset();
    operations.set([
      {
        id: 'first',
        type: OperationType.UNPAID_FINES,
        fineStatus: 2,
        timePeriod: 1,
        plate: '1234ABC',
        amount: -30,
        date: '08/09/2026',
        zone: 'Zone',
        latitude: 43,
        longitude: -2,
      },
    ]);
    await TestBed.configureTestingModule({
      imports: [OperationsDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: params } },
        {
          provide: OperationsService,
          useValue: {
            operations,
            loadDetail,
            loadReceipt: () => Promise.resolve(null),
            getOperationById: (id: string) => operations().find((op) => op.id === id),
          },
        },
        {
          provide: CitiesService,
          useValue: { getCities: () => Promise.resolve([]), nameFor: () => '', coordinatesFor: () => ({ latitude: 43, longitude: -2 }) },
        },
        { provide: TranslationService, useValue: { translate: (key: string) => key } },
      ],
    }).compileComponents();
  });

  it('does not show a map for an unpaid fine moved to history', async () => {
    const fixture = TestBed.createComponent(OperationsDetailComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-location-map')).toBeNull();
  });

  it('reloads each selection including returning to the first item', async () => {
    const fixture = TestBed.createComponent(OperationsDetailComponent);
    await fixture.whenStable();
    params.next(convertToParamMap({ id: 'second' }));
    await fixture.whenStable();
    params.next(convertToParamMap({ id: 'first' }));
    await fixture.whenStable();
    expect(loadDetail.calls.allArgs().map((args) => args[0])).toEqual(['first', 'second', 'first']);
  });

  it('keeps the map for paid fines and updates its coordinates', async () => {
    operations.update((items) => items.map((op) => ({ ...op, type: OperationType.FINE_PAYMENT })));
    const fixture = TestBed.createComponent(OperationsDetailComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-location-map')).not.toBeNull();
    operations.update((items) => items.map((op) => ({ ...op, type: OperationType.UNPAID_FINES })));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-location-map')).toBeNull();
  });

  it('does not replace zero fine coordinates with the municipality map', async () => {
    operations.update((items) => items.map((op) => ({ ...op, type: OperationType.FINE_PAYMENT, latitude: 0, longitude: 0 })));
    const fixture = TestBed.createComponent(OperationsDetailComponent);

    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-location-map')).toBeNull();
  });
});
