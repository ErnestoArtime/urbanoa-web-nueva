import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { OnboardingUserComponent } from './user.component';

describe('Onboarding profile save', () => {
  for (const rejected of [false, true]) {
    it(`stays on the form after a failed save (exception: ${rejected}) and allows retry`, async () => {
      const save = jasmine
        .createSpy()
        .and.callFake(() => (rejected ? Promise.reject(new Error('offline')) : Promise.resolve({ success: false })));
      const navigate = jasmine.createSpy().and.resolveTo(true);
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: UserService, useValue: { save } },
          { provide: Router, useValue: { navigate } },
        ],
      });
      const component = TestBed.runInInjectionContext(() => new OnboardingUserComponent());
      component.form.patchValue({ name: 'Name', surname: 'Surname' });
      await component.continue();
      expect(navigate).not.toHaveBeenCalled();
      expect(component.failed()).toBeTrue();
      expect(component.saving()).toBeFalse();
      save.and.resolveTo({ success: true });
      await component.continue();
      expect(navigate).toHaveBeenCalledOnceWith(['/onboarding/payment']);
    });
  }
  it('does not submit twice while the profile write is pending', async () => {
    let finish!: (value: { success: boolean }) => void;
    const save = jasmine.createSpy().and.returnValue(new Promise((resolve) => (finish = resolve)));
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: UserService, useValue: { save } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new OnboardingUserComponent());
    component.form.patchValue({ name: 'Name', surname: 'Surname' });
    const first = component.continue();
    await component.continue();
    expect(save).toHaveBeenCalledTimes(1);
    finish({ success: true });
    await first;
  });
});
