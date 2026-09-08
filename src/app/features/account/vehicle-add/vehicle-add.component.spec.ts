import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { VehicleAddComponent } from './vehicle-add.component';
import { VehicleService, type VehicleMutationResult } from '../../../core/services/vehicle.service';
import { TranslationService } from '../../../core/services/translation.service';
import { OpsApiError } from '../../../core/api/ops-api.types';

describe('VehicleAddComponent', () => {
  let vehicleService: { add: jasmine.Spy };

  beforeEach(() => {
    localStorage.clear();
    vehicleService = {
      add: jasmine.createSpy('add'),
    };
    TestBed.configureTestingModule({
      imports: [VehicleAddComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        { provide: VehicleService, useValue: vehicleService },
        {
          provide: TranslationService,
          useValue: {
            currentLang$: () => 'es',
            translate: (key: string) => (key === 'account.vehicleAdd.addErrorPrefix' ? 'No se pudo insertar la nueva matrícula: ' : key),
          },
        },
      ],
    });
  });

  it('requires a plate before saving', async () => {
    const fixture = TestBed.createComponent(VehicleAddComponent);
    fixture.detectChanges();

    await fixture.componentInstance.save();

    expect(fixture.componentInstance.plateError()).toBeTrue();
    expect(vehicleService.add).not.toHaveBeenCalled();
  });

  it('rejects a national plate that does not match a known format', async () => {
    const fixture = TestBed.createComponent(VehicleAddComponent);
    fixture.componentInstance.plate.set('ABC-0001');

    await fixture.componentInstance.save();

    expect(fixture.componentInstance.plateInvalid()).toBeTrue();
    expect(vehicleService.add).not.toHaveBeenCalled();
  });

  it('rejects a foreign plate with characters other than letters, numbers or hyphens', async () => {
    const fixture = TestBed.createComponent(VehicleAddComponent);
    fixture.componentInstance.plate.set('ABC_0001');
    fixture.componentInstance.foreignPlate.set(true);

    await fixture.componentInstance.save();

    expect(fixture.componentInstance.plateInvalid()).toBeTrue();
    expect(vehicleService.add).not.toHaveBeenCalled();
  });

  it('rejects a foreign plate longer than ten characters', async () => {
    const fixture = TestBed.createComponent(VehicleAddComponent);
    fixture.componentInstance.plate.set('ABCD-1234-5');
    fixture.componentInstance.foreignPlate.set(true);

    await fixture.componentInstance.save();

    expect(fixture.componentInstance.plateInvalid()).toBeTrue();
    expect(vehicleService.add).not.toHaveBeenCalled();
  });

  it('accepts a foreign plate with hyphens up to ten characters', async () => {
    const fixture = TestBed.createComponent(VehicleAddComponent);
    fixture.componentInstance.plate.set('AB-12-CD');
    fixture.componentInstance.foreignPlate.set(true);
    vehicleService.add.and.resolveTo({ success: true, source: 'remote' } satisfies VehicleMutationResult);

    await fixture.componentInstance.save();

    expect(fixture.componentInstance.plateInvalid()).toBeFalse();
    expect(vehicleService.add).toHaveBeenCalled();
  });

  it('reports success when the plate is added', async () => {
    const fixture = TestBed.createComponent(VehicleAddComponent);
    fixture.componentInstance.plate.set('1234 BCD');
    vehicleService.add.and.resolveTo({ success: true, source: 'remote' } satisfies VehicleMutationResult);

    await fixture.componentInstance.save();

    expect(fixture.componentInstance.saved()).toBeTrue();
    expect(fixture.componentInstance.addFailed()).toBeFalse();
  });

  it('shows the localized backend error message when the API fails', async () => {
    const fixture = TestBed.createComponent(VehicleAddComponent);
    fixture.componentInstance.plate.set('1234 BCD');
    const error = new OpsApiError('backend', 'OPSWebServicesAPI/AddPlateAPI', 'Error genérico', 200, {
      code: -9,
      type: 2,
      message_EN: 'Generic error',
      message_ES: 'Error genérico',
      message_EU: 'Errore generikoa',
      message_FR: 'Erreur générique',
    });
    vehicleService.add.and.resolveTo({ success: false, source: 'error', error } as VehicleMutationResult);

    await fixture.componentInstance.save();

    expect(fixture.componentInstance.saved()).toBeFalse();
    expect(fixture.componentInstance.addFailed()).toBeTrue();
    expect(fixture.componentInstance.addErrorMessage()).toBe('Error genérico');
  });

  it('shows the generic fallback when the API error is not parseable', async () => {
    const fixture = TestBed.createComponent(VehicleAddComponent);
    fixture.componentInstance.plate.set('1234 BCD');
    const error = new OpsApiError('transport', 'OPSWebServicesAPI/AddPlateAPI', 'Network error', 0);
    vehicleService.add.and.resolveTo({ success: false, source: 'error', error } as VehicleMutationResult);

    await fixture.componentInstance.save();

    expect(fixture.componentInstance.saved()).toBeFalse();
    expect(fixture.componentInstance.addFailed()).toBeTrue();
    expect(fixture.componentInstance.addErrorMessage()).toBeNull();
  });

  it('renders the error modal with prefix plus localized message when the save fails', async () => {
    const fixture = TestBed.createComponent(VehicleAddComponent);
    fixture.componentInstance.plate.set('1234 BCD');
    const error = new OpsApiError('backend', 'OPSWebServicesAPI/AddPlateAPI', 'Error genérico', 200, {
      code: -9,
      type: 2,
      message_EN: 'Generic error',
      message_ES: 'Error genérico',
      message_EU: 'Errore generikoa',
      message_FR: 'Erreur générique',
    });
    vehicleService.add.and.resolveTo({ success: false, source: 'error', error } as VehicleMutationResult);

    await fixture.componentInstance.save();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('app-result-modal') as HTMLElement;
    expect(modal).not.toBeNull();
    expect(modal.querySelector('.result-message')?.textContent?.trim()).toBe('No se pudo insertar la nueva matrícula: Error genérico');
  });
});