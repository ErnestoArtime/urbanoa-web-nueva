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
