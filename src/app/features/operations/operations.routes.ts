import { Routes } from '@angular/router';

export const OPERATIONS_ROUTES: Routes = [
  {
    path: '',
    title: 'ops.title',
    loadComponent: () => import('./operations-layout/operations-layout.component').then((m) => m.OperationsLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'ops.title',
        loadComponent: () => import('./operations-empty/operations-empty.component').then((m) => m.OperationsEmptyComponent),
      },
      {
        path: 'detail/:id',
        title: 'ops.detail.title',
        loadComponent: () => import('./detail/detail.component').then((m) => m.OperationsDetailComponent),
      },
      {
        path: 'unpaid-fines',
        title: 'ops.unpaidFines.title',
        loadComponent: () => import('./unpaid-fines/unpaid-fines.component').then((m) => m.UnpaidFinesComponent),
      },
      {
        path: 'unpaid-fine-detail/:id',
        title: 'ops.fineDetail.title',
        loadComponent: () => import('./unpaid-fine-detail/unpaid-fine-detail.component').then((m) => m.UnpaidFineDetailComponent),
      },
      { path: 'report', title: 'ops.title', loadComponent: () => import('./report/report.component').then((m) => m.ReportComponent) },
      {
        path: 'report-success',
        loadComponent: () => import('./report-success/report-success.component').then((m) => m.ReportSuccessComponent),
      },
    ],
  },
];
