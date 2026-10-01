import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoaderComponent } from './loader.component';

describe('LoaderComponent', () => {
  let fixture: ComponentFixture<LoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoaderComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(LoaderComponent);
    fixture.componentRef.setInput('useApkAnimation', false);
  });

  it('keeps a visible fallback when the APK animation is disabled', async () => {
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('message', 'Cargando');
    await fixture.whenStable();

    const overlay: HTMLElement = fixture.nativeElement.querySelector('.loader-overlay');
    expect(overlay.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('.loader-fallback')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.loader-message').textContent).toBe('Cargando');
  });

  it('fades the joins from the exact logo green to the dialog color without a dark band', () => {
    const stops = [0, 1, 1, 1, 0.27, 1, 1, 1, 0, 1, 0.27, 0];
    const gradient = { ty: 'gs', g: { p: 2, k: { a: 0, k: stops } } };
    const component = fixture.componentInstance as unknown as { tintAnimationData: (value: unknown) => void };

    component.tintAnimationData(gradient);

    expect(stops[0]).toBe(0);
    expect(stops[4]).toBe(0.27);
    expect(stops.slice(8)).toEqual([0, 1, 0.27, 1]);
    expect(stops.slice(1, 4)).toEqual([40 / 255, 115 / 255, 111 / 255]);
    expect(stops.slice(5, 8)).toEqual([247 / 255, 248 / 255, 239 / 255]);
  });

  it('removes the loading announcement and hides the overlay when loading ends', async () => {
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('message', 'Cargando');
    await fixture.whenStable();

    fixture.componentRef.setInput('visible', false);
    await fixture.whenStable();

    const overlay: HTMLElement = fixture.nativeElement.querySelector('.loader-overlay');
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(overlay).visibility).toBe('hidden');
    expect(fixture.nativeElement.querySelector('.loader-message')).toBeNull();
  });

  it('keeps the opposite join fading in the mirrored direction', () => {
    const stops = [0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1];
    const component = fixture.componentInstance as unknown as { tintAnimationData: (value: unknown) => void };
    component.tintAnimationData({ ty: 'gs', g: { p: 2, k: { a: 0, k: stops } } });

    expect(stops.slice(1, 4)).toEqual([247 / 255, 248 / 255, 239 / 255]);
    expect(stops.slice(5, 8)).toEqual([40 / 255, 115 / 255, 111 / 255]);
  });
});
