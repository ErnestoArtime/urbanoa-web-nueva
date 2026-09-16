import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TranslationService } from './translation.service';

describe('TranslationService catalogue refresh', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
  const response = (data: Record<string, string>) => ({ ok: true, json: async () => data }) as Response;

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
