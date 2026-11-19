import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AccountTaxDataComponent } from './tax-data.component';
import { UserService } from '../../../core/services/user.service';

describe('APK fiscal data rules', () => {
  let component: AccountTaxDataComponent;
  let save: jasmine.Spy;
  beforeEach(() => {
    save = jasmine.createSpy().and.resolveTo({ success: true });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: UserService,
          useValue: {
            save,
            user: signal({
              nif: '',
              address: {
                street: '',
                number: '',
                floor: '',
                door: '',
                stair: '',
                letter: '',
                city: '',
                province: '',
                postalCode: '',
                country: '',
              },
            }),
          },
        },
      ],
    });
    component = TestBed.runInInjectionContext(() => new AccountTaxDataComponent());
  });
  it('does not save an empty form but accepts partial addresses without a NIF', async () => {
    expect(component.canSave()).toBeFalse();
    await component.save();
    expect(save).not.toHaveBeenCalled();
    component.setAddress('street', 'Kale Nagusia');
    expect(component.canSave()).toBeTrue();
    await component.save();
    expect(save).toHaveBeenCalledWith(jasmine.objectContaining({ nif: '', address: jasmine.objectContaining({ street: 'Kale Nagusia' }) }));
  });
  it('accepts a country alone and treats whitespace as empty', () => {
    component.setAddress('country', '  ');
    expect(component.canSave()).toBeFalse();
    component.setAddress('country', 'ES');
    expect(component.canSave()).toBeTrue();
  });
  describe('province and municipality dependency', () => {
    it('offers Spanish provinces when the country is empty or Spain and French ones for France', () => {
      expect(component.provinceOptions().length).toBeGreaterThan(40);
      component.setCountry('Francia');
      expect(component.provinceOptions().some((option) => option.id === 'FR-L')).toBeTrue();
      component.setCountry('Portugal');
      expect(component.provinceOptions()).toEqual([]);
    });
    it('restricts municipalities to the selected province when a list exists', () => {
      component.setProvince('Bizkaia');
      expect(component.municipalityOptions()).toContain('Bilbao');
      component.setProvince('Madrid');
      expect(component.municipalityOptions()).toEqual([]);
    });
    it('clears the city when the province changes and both fields when the country changes', () => {
      component.setProvince('Bizkaia');
      component.setAddress('city', 'Bilbao');
      component.setProvince('Gipuzkoa');
      expect(component.address().city).toBe('');
      component.setProvince('Gipuzkoa');
      component.setAddress('city', 'Donostia');
      component.setCountry('Francia');
      expect(component.address().province).toBe('');
      expect(component.address().city).toBe('');
    });
    it('discards free text that is not in the province or municipality lists', () => {
      const input = document.createElement('input');
      input.value = 'Bizk';
      component.setProvince(input.value);
      component.commitProvince(input);
      expect(component.address().province).toBe('');
      component.setProvince('Araba');
      input.value = 'Nowhere';
      component.commitCity(input);
      expect(component.address().city).toBe('');
      input.value = 'Amurrio';
      component.commitCity(input);
      expect(component.address().city).toBe('Amurrio');
    });
    it('keeps free text for countries without a list', () => {
      component.setCountry('Portugal');
      const input = document.createElement('input');
      input.value = 'Porto';
      component.setAddress('city', 'Porto');
      component.commitCity(input);
      expect(component.address().city).toBe('Porto');
    });
  });
  for (const [nif, valid] of [
    ['12345678A', true],
    ['X1234567L', true],
    ['B12345678', true],
    ['invalid', false],
    ['12345678', false],
  ] as const) {
    it(`validates NIF format ${nif} like the APK: ${valid}`, async () => {
      component.setNif(nif);
      expect(component.validNif()).toBe(valid);
      await component.save();
      expect(save.calls.count()).toBe(valid ? 1 : 0);
    });
  }
});
