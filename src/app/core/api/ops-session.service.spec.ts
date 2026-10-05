import { OpsSessionService } from './ops-session.service';

describe('OpsSessionService', () => {
  it('cancels old requests and resets account listeners only when the token changes', () => {
    const session = new OpsSessionService();
    session.setToken('u1');
    const controller = new AbortController();
    session.registerRequest(controller);
    const changed = jasmine.createSpy('changed');
    const unsubscribe = session.onChange(changed);
    session.setToken('u1');
    expect(controller.signal.aborted).toBeFalse();
    expect(changed).not.toHaveBeenCalled();
    session.setToken('u2');
    expect(controller.signal.aborted).toBeTrue();
    expect(changed).toHaveBeenCalledTimes(1);
    unsubscribe();
    session.clear();
    expect(changed).toHaveBeenCalledTimes(1);
  });
  it('never restores a bearer token from legacy browser storage', () => {
    localStorage.setItem('urbanoa.auth.user', JSON.stringify({ token: 'old-token' }));
    try {
      expect(new OpsSessionService().token()).toBeNull();
    } finally {
      localStorage.removeItem('urbanoa.auth.user');
    }
  });
});
