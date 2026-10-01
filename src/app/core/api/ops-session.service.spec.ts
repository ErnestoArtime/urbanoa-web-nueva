import { OpsSessionService } from './ops-session.service';

describe('OpsSessionService', () => {
  it('never restores a bearer token from legacy browser storage', () => {
    localStorage.setItem('urbanoa.auth.user', JSON.stringify({ token: 'old-token' }));
    try {
      expect(new OpsSessionService().token()).toBeNull();
    } finally {
      localStorage.removeItem('urbanoa.auth.user');
    }
  });
});
