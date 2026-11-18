import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordService } from '../../../core/services/password.service';
import { TranslationService } from '../../../core/services/translation.service';
import { AccountChangePasswordComponent } from './change-password.component';

describe('AccountChangePasswordComponent validation', () => {
  let updatePassword: jasmine.Spy;

  beforeEach(async () => {
    updatePassword = jasmine.createSpy('updatePassword').and.resolveTo(undefined);

    await TestBed.configureTestingModule({
      imports: [AccountChangePasswordComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: {} },
        { provide: PasswordService, useValue: { updatePassword } },
        { provide: TranslationService, useValue: { translate: (key: string) => key, currentLang$: () => 'es' } },
      ],
    }).compileComponents();
  });

  function create(current: string, next: string, confirmation: string): AccountChangePasswordComponent {
    const component = TestBed.createComponent(AccountChangePasswordComponent).componentInstance;
    component.current.set(current);
    component.next.set(next);
    component.confirmation.set(confirmation);
    return component;
  }

  it('reports a new password shorter than six characters', async () => {
    const component = create('actual', 'abc1', 'abc1');

    await component.save();

    expect(component.errorKey()).toBe('account.changePassword.invalidLength');
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('reports a new password without a number', async () => {
    const component = create('actual', 'abcdefg', 'abcdefg');

    await component.save();

    expect(component.errorKey()).toBe('account.changePassword.invalid');
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('reports a confirmation that does not match a valid new password', async () => {
    const component = create('actual', 'abcdef1', 'abcdef2');

    await component.save();

    expect(component.errorKey()).toBe('account.changePassword.mismatch');
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('submits when the new password is valid and confirmed', async () => {
    const component = create('actual', 'abcdef1', 'abcdef1');

    await component.save();

    expect(updatePassword).toHaveBeenCalledWith('abcdef1', 'actual');
  });
});
