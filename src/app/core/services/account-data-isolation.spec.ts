import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsSessionService } from '../api/ops-session.service';
import { UserService } from './user.service';
import { OperationsService } from './operations.service';
import { NotificationsService } from './notifications.service';
import { SupportService } from './support.service';
import { CitiesService } from './cities.service';
import { WalletService } from './wallet.service';
import { VehicleService } from './vehicle.service';

describe('Account data isolation', () => {
  let api: jasmine.SpyObj<OpsApiClient>;
  let session: OpsSessionService;

  beforeEach(() => {
    sessionStorage.clear();
    api = jasmine.createSpyObj('OpsApiClient', ['get', 'getOrNull', 'post']);
    TestBed.configureTestingModule({ providers: [
      provideZonelessChangeDetection(),
      { provide: OpsApiClient, useValue: api },
      { provide: CitiesService, useValue: { nameFor: () => 'City', contractIdFor: () => 1 } },
    ] });
    session = TestBed.inject(OpsSessionService);
    session.setToken('u1-token');
  });

  it('clears the remote profile before saving another account', async () => {
    const service = TestBed.inject(UserService);
    api.get.and.resolveTo({ email: 'u1@example.com', userName: 'u1-login', contractId: 3, password: 'old-secret' });
    await service.load();
    session.setToken('u2-token');
    expect(service.user().email).toBe('');
    service.updateLocal({ email: 'u2@example.com' });
    api.post.and.resolveTo('ok');
    await service.save({ name: 'U2' });
    const body = api.post.calls.mostRecent().args[1] as Record<string, unknown>;
    expect(body['userName']).toBe('u2@example.com');
    expect(body['contractId']).toBe(0);
    expect(body['password']).toBeUndefined();
  });

  for (const rejected of [false, true]) {
    it(`ignores an old profile ${rejected ? 'failure' : 'response'} after U2 has loaded`, async () => {
      const service = TestBed.inject(UserService);
      let resolve!: (value: unknown) => void;
      let reject!: (error: Error) => void;
      api.get.and.returnValue(new Promise((res, rej) => { resolve = res; reject = rej; }));
      const old = service.load();
      session.setToken('u2-token');
      api.get.and.resolveTo({ email: 'u2@example.com', names: 'U2' });
      await service.load();
      if (rejected) reject(new Error('old request failed'));
      else resolve({ email: 'u1@example.com', names: 'U1' });
      await old;
      expect(service.user().email).toBe('u2@example.com');
      expect(service.source()).toBe('remote');
    });
  }

  it('does not reuse U1 operation requests or apply their results to U2', async () => {
    const service = TestBed.inject(OperationsService);
    let resolve!: (value: unknown) => void;
    api.post.and.returnValue(new Promise(res => { resolve = res; }));
    const old = service.load();
    session.setToken('u2-token');
    api.post.and.resolveTo([{ operationNumber: 2, operationType: 1, opDate: '120000051026' }]);
    await service.load();
    expect(api.post).toHaveBeenCalledTimes(2);
    resolve([{ operationNumber: 1, operationType: 1, opDate: '120000051026' }]);
    await old;
    expect(service.operations().map(op => op.id)).toEqual(['2']);
    session.clear();
    expect(service.operations()).toEqual([]);
    expect(service.activeParkings()).toEqual([]);
  });

  it('clears notifications and ignores an old notification response', async () => {
    const service = TestBed.inject(NotificationsService);
    service.preferences.update(p => ({ ...p, quantityBalance: 9999 }));
    let resolve!: (value: unknown) => void;
    api.get.and.returnValue(new Promise(res => { resolve = res; }));
    const old = service.load();
    session.setToken('u2-token');
    expect(service.preferences().quantityBalance).toBe(500);
    api.get.and.resolveTo({ notifications: { quantityBalance: 1234 } });
    await service.load();
    resolve({ notifications: { quantityBalance: 9999 } });
    await old;
    expect(service.preferences().quantityBalance).toBe(1234);
  });

  it('does not apply a completed U1 profile save after switching to U2', async () => {
    const service = TestBed.inject(UserService);
    service.updateLocal({ email: 'u1@example.com' });
    let resolve!: (value: unknown) => void;
    api.post.and.returnValue(new Promise(res => { resolve = res; }));
    const old = service.save({ name: 'U1' });
    session.setToken('u2-token');
    service.updateLocal({ email: 'u2@example.com', name: 'U2' });
    resolve('ok');
    expect((await old).success).toBeFalse();
    expect(service.user().name).toBe('U2');
    expect(service.user().email).toBe('u2@example.com');
  });

  it('clears support aliases and ignores an old support response', async () => {
    const service = TestBed.inject(SupportService);
    api.post.and.resolveTo({ feedback: [{ id: 12, baseId: null, contractId: 1, date: '120000051026', type: 1, subtype: 1, status: 1, read: 0, message: 'U1' }] });
    await service.load();
    expect(service.threads().length).toBe(1);
    let resolve!: (value: unknown) => void;
    api.post.and.returnValue(new Promise(res => { resolve = res; }));
    const old = service.load();
    session.setToken('u2-token');
    expect(service.getById('12')).toBeUndefined();
    resolve({ feedback: [{ id: 12, date: '120000051026', message: 'U1' }] });
    expect(await old).toBeFalse();
    expect(service.threads()).toEqual([]);
    expect(service.source()).toBe('idle');
  });

  it('clears wallet and vehicles on session changes without reusing an old vehicle load', async () => {
    const wallet = TestBed.inject(WalletService);
    const vehicles = TestBed.inject(VehicleService);
    wallet.credit(50, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });
    let resolve!: (value: unknown) => void;
    const getOrNull = api.getOrNull.and.returnValue(new Promise(res => { resolve = res; }));
    const old = vehicles.load();
    session.setToken('u2-token');
    expect(wallet.balance()).toBe(0);
    expect(wallet.movements()).toEqual([]);
    getOrNull.and.resolveTo({ plates: [{ plate: 'U2', favorite: 1 }] });
    await vehicles.load();
    resolve({ plates: [{ plate: 'U1', favorite: 1 }] });
    await old;
    expect(vehicles.vehicles().map(v => v.plate)).toEqual(['U2']);
  });
});
