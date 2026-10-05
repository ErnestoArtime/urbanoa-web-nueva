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

  it('persists pending synchronization per account and ignores stale confirmations', () => {
    const service = new LocationSettingsService();
    service.setUserScope('user-a');
    service.setPreferredCity('zarautz', 'Zarautz', 3, true);
    const saved = service.settings();
    service.setUserScope('user-b');
    service.confirmPreferredCitySync(saved);
    expect(service.settings().preferredCityId).toBeUndefined();
    service.setUserScope('user-a');
    expect(service.settings().preferredCitySyncPending).toBeTrue();
    service.confirmPreferredCitySync(service.settings());
    expect(service.settings().preferredCitySyncPending).toBeFalse();
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

  it('never assigns unowned legacy municipality settings to a newly signed-in account', () => {
    localStorage.setItem('urbanoa.location-settings', JSON.stringify({ preferredCityId: 'old-city', preferredContractId: 3 }));
    const service = new LocationSettingsService();
    service.setUserScope('u2');
    expect(service.settings().preferredCityId).toBeUndefined();
    expect(localStorage.getItem('urbanoa.location-settings.u2')).toBeNull();
  });

  it('discards a geolocation result requested by the previous user', async () => {
    let resolve!: PositionCallback;
    spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake(callback => { resolve = callback; });
    const service = new LocationSettingsService();
    service.setUserScope('u1');
    const old = service.requestCurrentLocation();
    service.setUserScope('u2');
    resolve({ coords: { latitude: 43, longitude: -2 }, timestamp: Date.now() } as GeolocationPosition);
    expect((await old).ok).toBeFalse();
    expect(service.settings().lastLatitude).toBeUndefined();
    expect(service.settings().useCurrentLocation).toBeFalse();
  });
});
