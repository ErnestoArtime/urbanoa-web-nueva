import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-report-success',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page text-center">
      <div class="success-icon">✓</div>
      <h1 class="page-title">{{ 'ops.report.success' | translate }}</h1>
      <p class="page-subtitle">{{ 'ops.report.successDetail' | translate }}</p>
      <a routerLink="/app/operations/report" class="btn btn-primary btn-block mt-2">{{ 'ops.report.back' | translate }}</a>
    </div>
  `,
})
export class ReportSuccessComponent {}
