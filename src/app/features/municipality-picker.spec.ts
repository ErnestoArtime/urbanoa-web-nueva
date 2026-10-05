import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccountSettingsComponent } from './account/settings/settings.component';
import { OnboardingLocationComponent } from './onboarding/location/location.component';
import { CitiesService } from '../core/services/cities.service';
import { UserService } from '../core/services/user.service';
import { LocationSettingsService } from '../core/services/location-settings.service';
import { TranslationService } from '../core/services/translation.service';

for (const componentType of [AccountSettingsComponent, OnboardingLocationComponent]) {
  describe(`${componentType.name} municipality confirmation`, () => {
    const city = { id: 'durango', nombre: 'Durango', provincia: '', zonas: 1, imagen: '', contractId: 1 };
    let update: jasmine.Spy;

    beforeEach(() => {
      localStorage.clear();
      update = jasmine.createSpy('updatePreferredContract').and.resolveTo({ success: false, source: 'error' });
      TestBed.configureTestingModule({ imports: [componentType], providers: [
        provideZonelessChangeDetection(), provideRouter([]),
        { provide: CitiesService, useValue: { getCities: async () => ({ data: [city] }), selectableCities: (data: unknown) => data, contractIdFor: () => 1 } },
        { provide: UserService, useValue: { user: () => ({}), updatePreferredContract: update } },
        { provide: TranslationService, useValue: { translate: (key: string) => key === 'common.save' ? 'Guardar' : key } },
      ] });
    });

    async function open() {
      const fixture = TestBed.createComponent<AccountSettingsComponent | OnboardingLocationComponent>(componentType);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.componentInstance.openCityPicker();
      fixture.detectChanges();
      return fixture;
    }

    it('saves locally and closes the picker when OPS cannot confirm the municipality', async () => {
      const fixture = await open();
      const root = fixture.nativeElement as HTMLElement;
      const save = Array.from(root.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Guardar')!;
      expect(save.disabled).toBeTrue();
      (root.querySelector('.city-option') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(save.disabled).toBeFalse();
      expect(update).not.toHaveBeenCalled();
      expect(TestBed.inject(LocationSettingsService).settings().preferredCityId).toBeUndefined();
      save.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(update).toHaveBeenCalledOnceWith(1);
      expect(fixture.componentInstance.showCityPicker()).toBeFalse();
      expect(TestBed.inject(LocationSettingsService).settings()).toEqual(jasmine.objectContaining({
        preferredCityId: city.id, preferredCitySyncPending: true,
      }));
      expect(root.textContent).toContain('citySaved');
      fixture.componentInstance.openCityPicker();
      expect(fixture.componentInstance.selectedCity()?.id).toBe(city.id);
    });

    it('discards the draft when cancelled without changing the saved municipality', async () => {
      const fixture = await open();
      (fixture.nativeElement.querySelector('.city-option') as HTMLButtonElement).click();
      fixture.componentInstance.closeCityPicker();
      expect(update).not.toHaveBeenCalled();
      expect(TestBed.inject(LocationSettingsService).settings().preferredCityId).toBeUndefined();
      fixture.componentInstance.openCityPicker();
      expect(fixture.componentInstance.selectedCity()).toBeNull();
    });

    it('closes the picker after a confirmed save', async () => {
      const fixture = await open();
      fixture.componentInstance.selectedCity.set(city);
      update.and.resolveTo({ success: true, source: 'remote' });
      await fixture.componentInstance.saveCity();
      expect(fixture.componentInstance.showCityPicker()).toBeFalse();
      expect(update).toHaveBeenCalledOnceWith(1);
      expect(TestBed.inject(LocationSettingsService).settings().preferredCitySyncPending).toBeFalse();
    });

    it('keeps the local choice and closes when the OPS request throws', async () => {
      const fixture = await open();
      fixture.componentInstance.selectedCity.set(city);
      update.and.rejectWith(new Error('OPS unavailable'));
      await fixture.componentInstance.saveCity();
      expect(fixture.componentInstance.showCityPicker()).toBeFalse();
      expect(TestBed.inject(LocationSettingsService).settings().preferredCitySyncPending).toBeTrue();
    });
  });
}
