import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

@Component({ template: '' })
class ReturnRouteTestComponent {}

describe('Paycomet return aliases', () => {
  for (const outcome of ['ok', 'ko']) {
    it(`preserves the OPS query parameters through /${outcome}`, async () => {
      TestBed.configureTestingModule({ providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          ...routes.filter(route => route.path === 'ok' || route.path === 'ko'),
          { path: 'app/paycomet/:outcome', component: ReturnRouteTestComponent },
        ]),
      ] });
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(`/${outcome}?r=WLT-test&h=signature&ret=0&i=1000`);
      const router = TestBed.inject(Router);
      expect(router.url).toBe(`/app/paycomet/${outcome}?r=WLT-test&h=signature&ret=0&i=1000`);
    });
  }
});
