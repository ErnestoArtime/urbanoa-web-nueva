import { Routes } from '@angular/router';

export const OPERATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./operations-layout/operations-layout.component').then((m) => m.OperationsLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./operations-empty/operations-empty.component').then((m) => m.OperationsEmptyComponent),
      },
      { path: 'detail/:id', loadComponent: () => import('./detail/detail.component').then((m) => m.OperationsDetailComponent) },
      { path: 'unpaid-fines', loadComponent: () => import('./unpaid-fines/unpaid-fines.component').then((m) => m.UnpaidFinesComponent) },
      {
        path: 'unpaid-fine-detail/:id',
        loadComponent: () => import('./unpaid-fine-detail/unpaid-fine-detail.component').then((m) => m.UnpaidFineDetailComponent),
      },
      { path: 'report', loadComponent: () => import('./report/report.component').then((m) => m.ReportComponent) },
      {
        path: 'report-success',
        loadComponent: () => import('./report-success/report-success.component').then((m) => m.ReportSuccessComponent),
      },
    ],
  },
];
