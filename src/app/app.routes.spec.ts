import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

@Component({ template: '' })
class ReturnRouteTestComponent {}

describe('Paycomet return aliases', () => {
  for (const callback of ['ok', 'ko', 'web-ui/ok', 'web-ui/ko']) {
    const outcome = callback.endsWith('ok') ? 'ok' : 'ko';
    it(`preserves the OPS query parameters through /${callback}`, async () => {
      TestBed.configureTestingModule({ providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          ...routes.filter(route => ['ok', 'ko', 'web-ui/ok', 'web-ui/ko'].includes(route.path ?? '')),
          { path: 'app/paycomet/:outcome', component: ReturnRouteTestComponent },
        ]),
      ] });
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(`/${callback}?r=WLT-test&h=signature&ret=0&i=1000`);
      const router = TestBed.inject(Router);
      expect(router.url).toBe(`/app/paycomet/${outcome}?r=WLT-test&h=signature&ret=0&i=1000`);
    });
  }
});
