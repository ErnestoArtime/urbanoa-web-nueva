import { NavigationToCarService } from './navigation-to-car.service';
describe('NavigationToCarService', () => {
  it('opens a walking route only for valid coordinates', () => {
    const open = spyOn(window, 'open');
    const service = new NavigationToCarService();
    for (const [latitude, longitude] of [
      [0, 0],
      [91, 2],
      [43, -181],
      [NaN, -2],
    ]) {
      expect(service.open({ latitude, longitude })).toBeFalse();
    }
    expect(open).not.toHaveBeenCalled();
    expect(service.open({ latitude: 43.28, longitude: -2.17 })).toBeTrue();
    expect(open).toHaveBeenCalledOnceWith(
      'https://www.google.com/maps/dir/?api=1&destination=43.28,-2.17&travelmode=walking',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
