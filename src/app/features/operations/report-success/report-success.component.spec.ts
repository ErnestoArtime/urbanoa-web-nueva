import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReportSuccessComponent } from './report-success.component';
import { TranslationService } from '../../../core/services/translation.service';
import { ReportArtifactService } from '../../../core/services/report-artifact.service';

describe('Report recovery', () => {
  it('explains an unavailable PDF and offers regeneration instead of false success', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideRouter([]),
      { provide: TranslationService, useValue: { translate: (key: string) => key } },
    ] });
    const fixture = TestBed.createComponent(ReportSuccessComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('ops.report.unavailableDetail');
    const artifact = TestBed.inject(ReportArtifactService);
    artifact.set(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('a[target="_blank"]')).not.toBeNull();
    artifact.clear();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('a[target="_blank"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('ops.report.unavailableDetail');
  });
});
