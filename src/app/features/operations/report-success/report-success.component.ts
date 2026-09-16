import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ReportArtifactService } from '../../../core/services/report-artifact.service';

@Component({
  selector: 'app-report-success',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="page text-center">
      @if (reportArtifact.url(); as reportUrl) {
        <div class="success-icon" aria-hidden="true">✓</div>
        <h1 class="page-title">{{ 'ops.report.success' | translate }}</h1>
        <p class="page-subtitle">{{ 'ops.report.successDetail' | translate }}</p>
        <a class="btn btn-secondary btn-block" [href]="reportUrl" target="_blank" rel="noopener">{{ 'ops.report.openPdf' | translate }}</a>
      } @else {
        <h1 class="page-title">{{ 'ops.report.unavailableTitle' | translate }}</h1>
        <p class="page-subtitle" role="status">{{ 'ops.report.unavailableDetail' | translate }}</p>
      }
      <a routerLink="/app/operations" class="btn btn-primary btn-block mt-2">{{ 'ops.report.goToOperations' | translate }}</a>
      <a routerLink="/app/operations/report" class="btn btn-ghost btn-block mt-1">{{ 'ops.report.backToReport' | translate }}</a>
    </div>
  `,
  styles: [
    `
      .mt-1 {
        margin-top: 0.35rem;
      }
    `,
  ],
})
export class ReportSuccessComponent {
  readonly reportArtifact = inject(ReportArtifactService);
}
