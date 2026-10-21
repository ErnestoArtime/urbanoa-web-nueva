import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TranslationService } from './translation.service';

describe('TranslationService catalogue refresh', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
  const response = (data: Record<string, string>) => ({ ok: true, json: async () => ({ 'app.title': 'ArinPark', ...data }) }) as Response;

  it('keeps the previous language on failure and never downloads a different catalogue', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(response({ 'nav.home': 'Inicio' }));
    const service = TestBed.inject(TranslationService);
    await service.setLang('es');
    fetchSpy.calls.reset();
    fetchSpy.and.rejectWith(new Error('offline'));
    await service.setLang('eu');
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy.calls.allArgs().every(([url]) => url === '/assets/i18n/eu.json')).toBeTrue();
    expect(service.currentLang$()).toBe('es');
    expect(service.translate('nav.home')).toBe('Inicio');
    expect(service.failedLang()).toBe('eu');
    expect(service.pendingLang()).toBeNull();
    expect(document.documentElement.lang).toBe('es');
    expect(localStorage.getItem('urbanoa-lang')).toBe('es');

    fetchSpy.and.resolveTo(response({ 'nav.home': 'Hasiera' }));
    await service.setLang('eu');
    expect(service.currentLang$()).toBe('eu');
    expect(service.translate('nav.home')).toBe('Hasiera');
    expect(service.failedLang()).toBeNull();
  });

  it('retries a transient failure using only the requested language', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.returnValues(
      Promise.reject(new Error('temporary failure')),
      Promise.resolve(response({ 'nav.home': 'Accueil' })),
    );
    const service = TestBed.inject(TranslationService);
    await service.setLang('fr');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.calls.allArgs().every(([url]) => url === '/assets/i18n/fr.json')).toBeTrue();
    expect(service.currentLang$()).toBe('fr');
    expect(service.translate('nav.home')).toBe('Accueil');
  });

  it('stops waiting after three timed-out attempts', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.callFake(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    );
    const service = TestBed.inject(TranslationService);
    jasmine.clock().install();
    try {
      const pending = service.setLang('eu');
      for (let attempt = 0; attempt < 3; attempt++) {
        jasmine.clock().tick(5_000);
        await Promise.resolve();
        await Promise.resolve();
      }
      await pending;
    } finally {
      jasmine.clock().uninstall();
    }
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(service.pendingLang()).toBeNull();
    expect(service.failedLang()).toBe('eu');
    expect(service.currentLang$()).toBe('es');
  });

  it('discards a late selection and cancels its request when another language is chosen', async () => {
    let finish!: (value: Response) => void;
    const fetchSpy = spyOn(window, 'fetch').and.returnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const service = TestBed.inject(TranslationService);
    const first = service.setLang('eu');
    const firstSignal = (fetchSpy.calls.mostRecent().args[1] as RequestInit).signal!;
    expect(service.pendingLang()).toBe('eu');
    fetchSpy.and.resolveTo(response({ 'nav.home': 'Accueil' }));
    await service.setLang('fr');
    expect(firstSignal.aborted).toBeTrue();
    finish(response({ 'nav.home': 'Hasiera' }));
    await first;
    expect(service.currentLang$()).toBe('fr');
    expect(service.translate('nav.home')).toBe('Accueil');
    expect(service.pendingLang()).toBeNull();
  });

  it('rejects a non-catalogue JSON payload without clearing working translations', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(response({ 'nav.home': 'Inicio' }));
    const service = TestBed.inject(TranslationService);
    await service.setLang('es');
    fetchSpy.and.resolveTo({ ok: true, json: async () => ({ error: { message: 'invalid' } }) } as Response);
    await service.setLang('fr');
    expect(service.currentLang$()).toBe('es');
    expect(service.translate('nav.home')).toBe('Inicio');
    expect(service.failedLang()).toBe('fr');
  });

  it('announces English as en while retaining the internal uk catalogue code when storage is blocked', async () => {
    spyOn(window, 'fetch').and.resolveTo(response({ 'common.retry': 'Retry' }));
    spyOn(Storage.prototype, 'setItem').and.throwError('storage blocked');
    const service = TestBed.inject(TranslationService);
    await service.setLang('uk');
    expect(service.currentLang$()).toBe('uk');
    expect(document.documentElement.lang).toBe('en');
    expect(service.translate('common.retry')).toBe('Retry');
  });

  it('recovers a new key from a refreshed catalogue without repeated requests', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(response({ 'ops.title': 'Operaciones' }));
    const service = TestBed.inject(TranslationService);
    await service.setLang('es');
    fetchSpy.and.resolveTo(response({ 'ops.title': 'Operaciones', 'ops.fineDetail.historic': 'No pagada' }));
    service.translate('ops.fineDetail.historic');
    service.translate('ops.fineDetail.historic');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(service.translate('ops.fineDetail.historic')).toBe('No pagada');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    service.translate('ops.missing');
    service.translate('ops.missing');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('does not replace a newly selected language with a late catalogue refresh', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(response({}));
    const service = TestBed.inject(TranslationService);
    await service.setLang('es');
    let finish!: (value: Response) => void;
    fetchSpy.and.returnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    service.translate('ops.fineDetail.historic');
    fetchSpy.and.resolveTo(response({ 'ops.fineDetail.historic': 'Non payée' }));
    await service.setLang('fr');
    finish(response({ 'ops.fineDetail.historic': 'No pagada' }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(service.translate('ops.fineDetail.historic')).toBe('Non payée');
    expect(service.currentLang$()).toBe('fr');
  });
});
