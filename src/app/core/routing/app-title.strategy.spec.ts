import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { TranslationService } from '../services/translation.service';
import { AppTitleStrategy } from './app-title.strategy';

describe('AppTitleStrategy', () => {
  const catalogueVersion = signal(0);
  let language: 'es' | 'eu';
  let strategy: AppTitleStrategy;
  let title: jasmine.SpyObj<Title>;

  beforeEach(() => {
    language = 'es';
    catalogueVersion.set(0);
    title = jasmine.createSpyObj<Title>('Title', ['setTitle']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AppTitleStrategy,
        { provide: Title, useValue: title },
        {
          provide: TranslationService,
          useValue: {
            translations$: catalogueVersion.asReadonly(),
            translate: (key: string) => {
              const values: Record<string, Record<string, string>> = {
                es: { 'app.title': 'ArinPark', 'nav.home': 'Inicio' },
                eu: { 'app.title': 'ArinPark', 'nav.home': 'Hasiera' },
              };
              return values[language][key] ?? `[${key}]`;
            },
          },
        },
      ],
    });

    strategy = TestBed.inject(AppTitleStrategy);
    TestBed.flushEffects();
  });

  it('combines the translated route title with the application name', () => {
    spyOn(strategy, 'buildTitle').and.returnValue('nav.home');

    strategy.updateTitle({} as RouterStateSnapshot);
    TestBed.flushEffects();

    expect(title.setTitle).toHaveBeenCalledWith('Inicio | ArinPark');
  });

  it('updates the current title when the translation catalogue changes', () => {
    spyOn(strategy, 'buildTitle').and.returnValue('nav.home');
    strategy.updateTitle({} as RouterStateSnapshot);
    TestBed.flushEffects();

    language = 'eu';
    catalogueVersion.update((version) => version + 1);
    TestBed.flushEffects();

    expect(title.setTitle).toHaveBeenCalledWith('Hasiera | ArinPark');
  });

  it('falls back to the application name instead of exposing a missing translation key', () => {
    spyOn(strategy, 'buildTitle').and.returnValue('missing.title');

    strategy.updateTitle({} as RouterStateSnapshot);
    TestBed.flushEffects();

    expect(title.setTitle).toHaveBeenCalledWith('ArinPark');
  });
});
