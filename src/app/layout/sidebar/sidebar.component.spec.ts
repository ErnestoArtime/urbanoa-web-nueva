import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { TranslationService } from '../../core/services/translation.service';
import { OperationsService } from '../../core/services/operations.service';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent operations badge', () => {
  async function render(badgeCount: number): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: { url: '/app/home', events: new Subject(), createUrlTree: () => ({}), serializeUrl: () => '' } },
        { provide: ActivatedRoute, useValue: {} },
        { provide: TranslationService, useValue: { currentLang$: () => 'es', translate: (key: string) => key } },
        {
          provide: OperationsService,
          useValue: { operationsBadgeCount: signal(badgeCount).asReadonly() },
        },
      ],
    });

    const fixture = TestBed.createComponent(SidebarComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the badge when there are active parkings and no unpaid fines', async () => {
    const host = await render(2);
    const badge = host.querySelector('.active-count');
    expect(badge?.textContent?.trim()).toBe('2');
  });

  it('adds the unpaid fines count to the badge', async () => {
    const host = await render(4);
    const badge = host.querySelector('.active-count');
    expect(badge?.textContent?.trim()).toBe('4');
  });

  it('hides the badge when there are no active parkings or unpaid fines', async () => {
    const host = await render(0);
    expect(host.querySelector('.active-count')).toBeNull();
  });
});