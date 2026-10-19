import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PasswordService } from '../../core/services/password.service';
import { RegisterComponent } from './register/register.component';
import { ResetPasswordConfirmComponent } from './reset-password-confirm/reset-password-confirm.component';
import { AccountChangePasswordComponent } from '../account/change-password/change-password.component';

describe('Password flows match the APK', () => {
  let password: jasmine.SpyObj<PasswordService>;
  let auth: jasmine.SpyObj<AuthService>;
  beforeEach(() => {
    password = jasmine.createSpyObj('PasswordService', ['updatePassword']);
    password.updatePassword.and.resolveTo();
    auth = jasmine.createSpyObj('AuthService', ['logout']);
    auth.logout.and.resolveTo();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: PasswordService, useValue: password },
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: {} },
      ],
    });
  });
  for (const component of [RegisterComponent, ResetPasswordConfirmComponent]) {
    it(`uses the same six-character and numeric validation for ${component.name}`, () => {
      const form = TestBed.runInInjectionContext(() => new component()).form;
      form.controls.password.setValue('abc123');
      expect(form.controls.password.valid).toBeTrue();
      form.controls.password.setValue('abcdefgh');
      expect(form.controls.password.valid).toBeFalse();
    });
  }
  it('rejects a password without digits and signs out after acknowledging a confirmed change', async () => {
    const component = TestBed.runInInjectionContext(() => new AccountChangePasswordComponent());
    component.next.set('abcdefgh');
    component.confirmation.set('abcdefgh');
    await component.save();
    expect(password.updatePassword).not.toHaveBeenCalled();
    component.current.set('old-secret');
    component.next.set('abc123');
    component.confirmation.set('abc123');
    await component.save();
    expect(password.updatePassword).toHaveBeenCalledOnceWith('abc123', 'old-secret');
    expect(component.result()).toBe('success');
    await component.dismissResult();
    expect(auth.logout).toHaveBeenCalledTimes(1);
  });
  it('keeps the session usable when changing the password fails', async () => {
    password.updatePassword.and.rejectWith(new Error('unavailable'));
    const component = TestBed.runInInjectionContext(() => new AccountChangePasswordComponent());
    component.current.set('old-secret');
    component.next.set('abc123');
    component.confirmation.set('abc123');
    await component.save();
    await component.dismissResult();
    expect(auth.logout).not.toHaveBeenCalled();
    expect(component.saving()).toBeFalse();
  });
});
