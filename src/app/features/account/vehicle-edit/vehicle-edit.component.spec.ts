import { provideZonelessChangeDetection } from '@angular/core';
import { convertToParamMap, provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { VehicleEditComponent } from './vehicle-edit.component';

describe('VehicleEditComponent', () => {
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  function mount(): ReturnType<typeof createFixture> {
    return createFixture();
  }

  function createFixture() {
    const fixture = TestBed.createComponent(VehicleEditComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'urbanoa.vehicles',
      JSON.stringify([
        { id: '1', plate: '1234 ABC', isDefault: true },
        { id: '2', plate: '5678 XYZ', isDefault: false },
      ]),
    );
    paramMap$ = new BehaviorSubject(convertToParamMap({ id: '1' }));
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        { provide: ActivatedRoute, useValue: { snapshot: paramMap$.value, paramMap: paramMap$.asObservable() } },
      ],
    });
  });

  it('shows the vehicle from the route parameter', () => {
    const fixture = mount();

    expect(fixture.componentInstance.id()).toBe('1');
    expect(fixture.componentInstance.plate()).toBe('1234 ABC');
    expect(fixture.componentInstance.favorite()).toBeTrue();
  });

  it('updates the panel when the route parameter changes to another vehicle', () => {
    const fixture = mount();

    paramMap$.next(convertToParamMap({ id: '2' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.id()).toBe('2');
    expect(fixture.componentInstance.plate()).toBe('5678 XYZ');
    expect(fixture.componentInstance.favorite()).toBeFalse();
  });
});
