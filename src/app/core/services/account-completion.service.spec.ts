import { TestBed } from '@angular/core/testing';
import { AccountCompletionService } from './account-completion.service';
import { LocationSettingsService } from './location-settings.service';

describe('AccountCompletionService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('moves from 75 to 100 percent when location is configured', () => {
    const completion = TestBed.inject(AccountCompletionService);
    const location = TestBed.inject(LocationSettingsService);

    expect(completion.percent()).toBe(75);

    location.setPreferredCity('donostia', 'Donostia');

    expect(completion.percent()).toBe(100);
  });
});
