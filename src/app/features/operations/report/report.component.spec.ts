import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { OpsApiClient } from '../../../core/api/ops-api-client.service';
import { OpsSessionService } from '../../../core/api/ops-session.service';
import { AuthService } from '../../../core/services/auth.service';
import { OperationsService } from '../../../core/services/operations.service';
import { ReportArtifactService } from '../../../core/services/report-artifact.service';
import { TranslationService } from '../../../core/services/translation.service';
import { UserService } from '../../../core/services/user.service';
import type { Operation } from '../../../shared/models/operation';
import { OperationType } from '../../../shared/models/operation-type';
import { ReportComponent } from './report.component';

describe('ReportComponent parking operations filter', () => {
  let fixture: ComponentFixture<ReportComponent>;
  let component: ReportComponent;
  let operations: ReturnType<typeof signal<Operation[]>>;
  let api: jasmine.SpyObj<OpsApiClient>;

  const operation = (type: OperationType, id: string): Operation => ({
    id,
    type,
    plate: '1234 ABC',
    date: new Intl.DateTimeFormat('es-ES').format(new Date()),
    amount: 1,
    zone: 'Zona 1',
  });

  beforeEach(async () => {
    operations = signal([
      operation(OperationType.PARKING, 'parking'),
      operation(OperationType.PARKING_EXTENSION, 'extension'),
      operation(OperationType.REFUND, 'unparking'),
      operation(OperationType.TOP_UP, 'top-up'),
    ]);
    api = jasmine.createSpyObj<OpsApiClient>('OpsApiClient', ['post']);
    api.post.and.resolveTo('JVBERi0xLjQ=');

    await TestBed.configureTestingModule({
      imports: [ReportComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        { provide: OperationsService, useValue: { operations } },
        { provide: TranslationService, useValue: { translate: (key: string) => key } },
        { provide: OpsApiClient, useValue: api },
        { provide: OpsSessionService, useValue: { token: () => 'test-token' } },
        { provide: UserService, useValue: { load: () => Promise.resolve({ email: 'user@example.com' }) } },
        { provide: AuthService, useValue: { user: signal({ email: 'user@example.com' }) } },
        { provide: ReportArtifactService, useValue: { set: () => '/report.pdf' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('shows one parking option instead of separate parking, extension and unparking options', () => {
    const filterRows = fixture.nativeElement.querySelectorAll('.filter-row') as NodeListOf<HTMLElement>;
    const text = Array.from(filterRows, (row) => row.textContent ?? '').join(' ');

    expect(filterRows.length).toBe(4);
    expect(text).toContain('ops.report.parkingOperations');
    expect(text).not.toContain('ops.report.extension');
    expect(text).not.toContain('ops.report.refunds');
  });

  it('enables or disables parking, extension and unparking together in the local preview', () => {
    expect(component.reportOperations().map(({ id }) => id)).toEqual(['parking', 'extension', 'unparking', 'top-up']);

    component.form.controls.parkingOperations.setValue(false);

    expect(component.reportOperations().map(({ id }) => id)).toEqual(['top-up']);
  });

  it('expands the consolidated option to the existing backend operation types', async () => {
    const viewer = { location: { href: '' }, close: jasmine.createSpy('close') };
    spyOn(globalThis, 'open').and.returnValue(viewer as unknown as Window);

    await component.generateReport();

    expect(api.post).toHaveBeenCalledWith(
      jasmine.any(String),
      jasmine.objectContaining({
        operationTypeList: [
          OperationType.PARKING,
          OperationType.PARKING_EXTENSION,
          OperationType.REFUND,
          OperationType.TOP_UP,
          OperationType.BALANCE_REFUND,
          OperationType.FINE_PAYMENT,
        ],
      }),
      { token: 'test-token' },
    );
  });
});
