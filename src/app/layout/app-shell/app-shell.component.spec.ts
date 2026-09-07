import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { OperationsService } from '../../core/services/operations.service';
import { TranslationService } from '../../core/services/translation.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { OpsSessionService } from '../../core/api/ops-session.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent session data bootstrap', () => {
  it('loads operations, vehicles and active parking statuses after a full reload', async () => {
    const routerEvents = new Subject<NavigationEnd>();
    const operations = jasmine.createSpyObj<OperationsService>('OperationsService', [
      'load',
      'loadDashboardParkingStatuses',
      'getOperationById',
    ]);
    const vehicles = jasmine.createSpyObj<VehicleService>('VehicleService', ['load'], {
      vehicles: signal([{ id: 'v1', plate: 'AAA111', isDefault: true }]).asReadonly(),
    });
    operations.load.and.resolveTo();
    operations.loadDashboardParkingStatuses.and.resolveTo();
    vehicles.load.and.resolveTo();
    const profile = {
      load: jasmine.createSpy().and.resolveTo(),
      user: signal({ name: 'Norkis', surname: 'Verdecia', email: 'n.verdecia@gentalia.es' }).asReadonly(),
    };

    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: { url: '/app/operations', events: routerEvents } },
        { provide: BreadcrumbService, useValue: jasmine.createSpyObj('BreadcrumbService', ['setFromUrl']) },
        { provide: TranslationService, useValue: { translate: (key: string) => key } },
        { provide: OperationsService, useValue: operations },
        { provide: VehicleService, useValue: vehicles },
        { provide: OpsSessionService, useValue: { token: () => 'session-token' } },
        { provide: UserService, useValue: profile },
        {
          provide: AuthService,
          useValue: { user: signal({ name: 'Test', surname: 'User', email: 'test@example.com' }).asReadonly(), logout: () => undefined },
        },
      ],
    })
      .overrideComponent(AppShellComponent, { set: { template: '', imports: [] } })
      .compileComponents();

    const fixture = TestBed.createComponent(AppShellComponent);
    await fixture.whenStable();

    expect(operations.load).toHaveBeenCalledTimes(1);
    expect(vehicles.load).toHaveBeenCalledTimes(1);
    expect(profile.load).toHaveBeenCalledTimes(1);
    expect(operations.loadDashboardParkingStatuses).toHaveBeenCalledOnceWith([jasmine.objectContaining({ id: 'v1', plate: 'AAA111' })]);
    expect(fixture.componentInstance.connectedUserName()).toBe('Norkis Verdecia');
    expect(fixture.componentInstance.connectedUserEmail()).toBe('n.verdecia@gentalia.es');
  });

  it('leaves the initial active-parking lookup to the entry route', async () => {
    const routerEvents = new Subject<NavigationEnd>();
    const operations = jasmine.createSpyObj<OperationsService>('OperationsService', [
      'load',
      'loadDashboardParkingStatuses',
      'getOperationById',
    ]);
    const vehicles = jasmine.createSpyObj<VehicleService>('VehicleService', ['load'], {
      vehicles: signal([{ id: 'v1', plate: 'AAA111', isDefault: true }]).asReadonly(),
    });
    operations.load.and.resolveTo();
    operations.loadDashboardParkingStatuses.and.resolveTo();
    vehicles.load.and.resolveTo();
    const profile = { load: jasmine.createSpy().and.resolveTo(), user: signal({ name: '', surname: '', email: '' }).asReadonly() };

    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: { url: '/app', events: routerEvents } },
        { provide: BreadcrumbService, useValue: jasmine.createSpyObj('BreadcrumbService', ['setFromUrl']) },
        { provide: TranslationService, useValue: { translate: (key: string) => key } },
        { provide: OperationsService, useValue: operations },
        { provide: VehicleService, useValue: vehicles },
        { provide: OpsSessionService, useValue: { token: () => 'session-token' } },
        { provide: UserService, useValue: profile },
        {
          provide: AuthService,
          useValue: { user: signal({ name: 'Test', surname: 'User', email: 'test@example.com' }).asReadonly(), logout: () => undefined },
        },
      ],
    })
      .overrideComponent(AppShellComponent, { set: { template: '', imports: [] } })
      .compileComponents();

    const fixture = TestBed.createComponent(AppShellComponent);
    await fixture.whenStable();

    expect(operations.load).toHaveBeenCalledTimes(1);
    expect(vehicles.load).toHaveBeenCalledTimes(1);
    expect(operations.loadDashboardParkingStatuses).not.toHaveBeenCalled();
  });
});
