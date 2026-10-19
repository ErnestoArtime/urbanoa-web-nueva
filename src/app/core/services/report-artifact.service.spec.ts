import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsSessionService } from '../api/ops-session.service';
import { ReportArtifactService } from './report-artifact.service';

describe('Report PDF lifetime', () => {
  it('keeps a confirmed PDF available beyond a minute and revokes it on account change', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const session = TestBed.inject(OpsSessionService);
    session.setToken('first');
    const artifact = TestBed.inject(ReportArtifactService);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
    const revoke = spyOn(URL, 'revokeObjectURL');
    jasmine.clock().install();
    try {
      artifact.set(new Blob(['%PDF-1.4']));
      jasmine.clock().tick(60001);
      expect(artifact.url()).toBe('blob:test');
      expect(revoke).not.toHaveBeenCalled();
      session.setToken('second');
      expect(artifact.url()).toBeNull();
      expect(revoke).toHaveBeenCalledOnceWith('blob:test');
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
