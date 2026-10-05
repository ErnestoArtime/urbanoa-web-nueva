import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslationService } from '../../../core/services/translation.service';
import { LangSelectorComponent } from './lang-selector.component';

describe('LangSelectorComponent', () => {
  it('changes language and closes the custom dropdown', () => {
    const currentLang = signal('es');
    const setLang = jasmine.createSpy('setLang');
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: TranslationService, useValue: { currentLang$: currentLang, setLang } }],
    });
    const fixture = TestBed.createComponent(LangSelectorComponent);
    fixture.detectChanges();
    const details: HTMLDetailsElement = fixture.nativeElement.querySelector('details');
    details.open = true;
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    buttons[2].click();
    expect(setLang).toHaveBeenCalledWith('fr');
    expect(details.open).toBeFalse();
    expect(document.activeElement).toBe(details.querySelector('summary'));
    currentLang.set('eu');
    fixture.detectChanges();
    expect(details.querySelector('summary')?.textContent).toContain('EU');
  });

  it('closes on Escape and on an outside click', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: TranslationService, useValue: { currentLang$: signal('es') } }],
    });
    const fixture = TestBed.createComponent(LangSelectorComponent);
    fixture.detectChanges();
    const details: HTMLDetailsElement = fixture.nativeElement.querySelector('details');
    details.open = true;
    details.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(details.open).toBeFalse();
    details.open = true;
    document.body.click();
    expect(details.open).toBeFalse();
  });
});
