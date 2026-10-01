import { LocationSettingsService } from './location-settings.service';

describe('LocationSettingsService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('is configured when a preferred city is saved', () => {
    const service = new LocationSettingsService();

    service.setPreferredCity('donostia', 'Donostia');

    expect(service.isConfigured()).toBeTrue();
    expect(service.settings().preferredCityName).toBe('Donostia');
    expect(service.settings().useCurrentLocation).toBeFalse();
  });

  it('does not inherit the previous stored authentication identity before login', () => {
    localStorage.setItem('urbanoa.auth.session', JSON.stringify({ user: { id: 'previous-user' } }));
    localStorage.setItem('urbanoa.location-settings.previous-user', JSON.stringify({ preferredCityId: 'private-city' }));
    expect(new LocationSettingsService().settings().preferredCityId).toBeUndefined();
  });

  it('disables current location without clearing preferred city', () => {
    const service = new LocationSettingsService();

    service.setPreferredCity('donostia', 'Donostia');
    service.toggleUseCurrentLocation(true);
    service.disableCurrentLocation();

    expect(service.settings().useCurrentLocation).toBeFalse();
    expect(service.isConfigured()).toBeTrue();
  });

  it('isolates the preferred city per authenticated user', () => {
    const service = new LocationSettingsService();

    service.setUserScope('user-a');
    service.setPreferredCity('donostia', 'Donostia', 1);
    service.setUserScope('user-b');

    expect(service.settings().preferredCityId).toBeUndefined();
    service.setPreferredCity('zarautz', 'Zarautz', 3);
    service.setUserScope('user-a');

    expect(service.settings()).toEqual(jasmine.objectContaining({ preferredCityId: 'donostia', preferredContractId: 1 }));
  });
});
