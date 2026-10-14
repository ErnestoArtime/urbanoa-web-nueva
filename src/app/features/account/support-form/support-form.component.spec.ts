import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CitiesService } from '../../../core/services/cities.service';
import { SupportService } from '../../../core/services/support.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AccountSupportFormComponent } from './support-form.component';

describe('support form consistency', () => {
  async function setup(newMessage = false, failCityLoad = false) {
    const support = {
      getById: (id: string) => ({ id, status: 'submitted' }),
      reply: jasmine.createSpy('reply').and.resolveTo(false),
      create: jasmine.createSpy('create').and.resolveTo(null),
    };
    const cities = { getCities: jasmine.createSpy('cities').and.resolveTo({ data: [] }) };
    if (failCityLoad) cities.getCities.and.rejectWith(new Error('catalogue unavailable'));
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'support/:id/reply', component: AccountSupportFormComponent },
          { path: 'support/new', component: AccountSupportFormComponent },
        ]),
        { provide: SupportService, useValue: support },
        { provide: CitiesService, useValue: cities },
        { provide: VehicleService, useValue: { vehicles: signal([]), load: async () => undefined, mainVehicle: () => undefined } },
      ],
    });
    TestBed.overrideComponent(AccountSupportFormComponent, { set: { template: '' } });
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl(newMessage ? '/support/new' : '/support/first/reply', AccountSupportFormComponent);
    await harness.fixture.whenStable();
    return { component, support, harness, cities };
  }

  it('keeps the draft and reports a service failure instead of missing fields', async () => {
    const { component } = await setup();
    component.form.controls.message.setValue('Mi mensaje');
    await component.submit();
    expect(component.sendFailed()).toBeTrue();
    expect(component.showError()).toBeTrue();
    expect(component.form.controls.message.value).toBe('Mi mensaje');
    expect(component.form.enabled).toBeTrue();
  });

  it('prevents duplicate sends while a reply is pending', async () => {
    const { component, support } = await setup();
    let finish!: (value: boolean) => void;
    support.reply.and.returnValue(
      new Promise<boolean>((resolve) => {
        finish = resolve;
      }),
    );
    component.form.controls.message.setValue('Mi mensaje');
    const pending = component.submit();
    await component.submit();
    expect(support.reply).toHaveBeenCalledTimes(1);
    expect(component.form.disabled).toBeTrue();
    finish(false);
    await pending;
    expect(component.form.enabled).toBeTrue();
  });

  it('changes the reply target and clears the previous draft when the route id changes', async () => {
    const { component, support, harness } = await setup();
    component.form.controls.message.setValue('Primer borrador');
    await harness.navigateByUrl('/support/second/reply', AccountSupportFormComponent);
    await harness.fixture.whenStable();
    expect(component.replyThread()?.id).toBe('second');
    expect(component.form.controls.message.value).toBe('');
    component.form.controls.message.setValue('Segundo borrador');
    await component.submit();
    expect(support.reply).toHaveBeenCalledOnceWith('second', 'Segundo borrador', undefined);
  });

  it('blocks sending when the municipality catalogue failed and preserves the draft through a retry', async () => {
    const { component, support, harness, cities } = await setup(true, true);
    expect(component.loadFailed()).toBeTrue();
    expect(component.form.disabled).toBeTrue();
    component.form.patchValue({ message: 'Borrador conservado', type: 'incident', subtype: 'app', cityId: 'durango' });
    await component.submit();
    expect(support.create).not.toHaveBeenCalled();
    cities.getCities.and.resolveTo({ data: [] });
    await component.retryLoad();
    await harness.fixture.whenStable();
    expect(component.loadFailed()).toBeFalse();
    expect(component.form.enabled).toBeTrue();
    expect(component.form.controls.message.value).toBe('Borrador conservado');
  });
});
