import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LocationSettingsService } from '../../core/services/location-settings.service';

export const canShowOnboardingReady: CanActivateFn = () => {
  const locationSettings = inject(LocationSettingsService);
  const router = inject(Router);

  return locationSettings.isConfigured() ? true : router.createUrlTree(['/app']);
};
