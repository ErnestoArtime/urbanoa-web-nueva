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

    it('selects a draft and saves only when Guardar is pressed, keeping errors inside the modal', async () => {
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
      expect(fixture.componentInstance.showCityPicker()).toBeTrue();
      expect(root.querySelector('.city-picker-modal [role="status"], .city-picker [role="status"]')?.textContent).toContain('citySaveError');
      expect(save.disabled).toBeFalse();
      save.click();
      await fixture.whenStable();
      expect(update).toHaveBeenCalledTimes(2);
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
    });
  });
}
