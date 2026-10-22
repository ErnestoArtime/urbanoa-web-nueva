import { TranslationService } from '../../../core/services/translation.service';
import { signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ResetPasswordComponent } from './reset-password.component';
import { PasswordService } from '../../../core/services/password.service';
import { OpsApiError } from '../../../core/api/ops-api.types';
import { OPS_ENDPOINTS } from '../../../core/api/ops-endpoints';
import { apiErrorKey } from '../../../core/http/api-error-key';

describe('ResetPasswordComponent recovery errors', () => {
  it('shows unknown email for OPS -20, stays on the form and allows a successful retry', async () => {
    const requestCode = jasmine
      .createSpy('requestCode')
      .and.rejectWith(
        new OpsApiError('backend', OPS_ENDPOINTS.auth.recoverPassword, 'Mobile user not found', undefined, {
          code: -20,
          type: 1,
          message_ES: 'El usuario del móvil no se encuentra',
        }),
      );
    const navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TranslationService, useValue: { currentLang$: signal('es'), translate: (key: string) => key } },
        FormBuilder,
        { provide: PasswordService, useValue: { requestCode } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ResetPasswordComponent());
    component.form.controls.email.setValue('deleted@example.com');
    await component.onSubmit();
    expect(component.errorKey()).toBe('El usuario del móvil no se encuentra');
    expect(component.submitting()).toBeFalse();
    expect(navigate).not.toHaveBeenCalled();
    requestCode.and.resolveTo();
    component.form.controls.email.setValue('existing@example.com');
    await component.onSubmit();
    expect(component.errorKey()).toBe('');
    expect(component.submitting()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/auth/reset-password-code'], { queryParams: { email: 'existing@example.com' } });
  });

  it('keeps -20 on other endpoints and transport failures separate', () => {
    expect(apiErrorKey(new OpsApiError('backend', OPS_ENDPOINTS.auth.login, 'Not found', undefined, { code: -20, type: 1 }))).toBe(
      'errors.server',
    );
    expect(apiErrorKey(new OpsApiError('transport', OPS_ENDPOINTS.auth.recoverPassword, 'Network failure'))).toBe('errors.network');
  });
});
