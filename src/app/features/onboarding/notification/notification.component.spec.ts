import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotificationsService } from '../../../core/services/notifications.service';
import { OnboardingNotificationComponent } from './notification.component';

describe('Onboarding notification persistence', () => {
  it('does not advance when saving preferences fails', async () => {
    const navigate = jasmine.createSpy().and.resolveTo(true);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(),
      { provide: Router, useValue: { navigate } },
      { provide: NotificationsService, useValue: { preferences: signal({}), save: jasmine.createSpy().and.resolveTo('error') } },
    ] });
    TestBed.overrideComponent(OnboardingNotificationComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(OnboardingNotificationComponent);
    await fixture.componentInstance.activate();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.componentInstance.saving()).toBeFalse();
  });
});
