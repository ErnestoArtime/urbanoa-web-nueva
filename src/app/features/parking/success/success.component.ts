import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingFlowQuery, readParkingFlowQuery } from '../parking-flow.model';
import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { OperationIconComponent } from '../../../shared/components/operation-icon/operation-icon.component';
import { OperationType } from '../../../shared/models/operation-type';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-parking-success',
  imports: [RouterLink, OperationIconComponent, TranslatePipe, AppIconComponent],
  template: `
    <div class="page success-page">
      <div class="success-content text-center">
        <p class="flow-step">{{ 'parking.success.step' | translate }}</p>
        <div class="success-mark"><span>✓</span><app-icon name="parkingSlip" /></div>
        <h1 class="page-title">{{ 'parking.success.title' | translate }}</h1>
        <p class="page-subtitle">{{ 'parking.success.subtitle' | translate }}</p>
        <article class="success-ticket">
          <div class="ticket-accent"></div>
          <div class="ticket-head"><app-operation-icon [type]="parkingType"/><div><strong>{{ query.plate }}</strong><span>{{ query.zone }} · {{ query.cityName }}</span></div></div>
          <div class="ticket-times"><div><small>{{ 'parking.success.start' | translate }}</small><strong>{{ startTime() }}</strong><span>{{ 'parking.success.today' | translate }}</span></div><i></i><b>{{ query.duration }}</b><i></i><div><small>{{ 'parking.success.end' | translate }}</small><strong>{{ query.endTime }}</strong><span>{{ 'parking.success.today' | translate }}</span></div></div>
          <div class="ticket-cut"></div><div class="ticket-total"><span>{{ 'parking.success.total' | translate }}</span><strong>{{ query.amount }}</strong></div>
        </article>
        <div class="actions">
          <a routerLink="/app/home" class="btn btn-primary btn-block">{{ 'parking.success.goHome' | translate }}</a>
          <a routerLink="/app/parking" [queryParams]="{city:query.city}" class="btn btn-ghost btn-block">{{ 'parking.success.viewMap' | translate }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block;height:100%}.success-page{width:100%;max-width:none;min-height:100%;display:flex;justify-content:center;padding:2rem}.success-content{width:min(100%,680px);margin:0 auto}.flow-step{color:var(--color-primary);font-size: var(--text-xs);font-weight: var(--font-extra);text-transform:uppercase;letter-spacing:.04em}
    .success-mark{position:relative;width:82px;height:82px;margin:0 auto 1rem;border-radius:50%;background:#a8e9e7;display:grid;place-items:center}.success-mark span{position:absolute;right:4px;top:-8px;color:var(--color-primary);font-size: var(--text-display);font-weight: var(--font-extra)}.success-mark svg{width:44px;height:44px;fill:none;stroke:var(--color-text);stroke-width:1.8}.success-ticket{overflow:hidden;width:100%;margin-top:1.2rem;border:1px solid var(--color-border);border-radius:16px;background:var(--color-surface);box-shadow:var(--shadow-md);text-align:left}.ticket-accent{height:14px;background:#248cda}.ticket-head{display:flex;align-items:center;gap:.8rem;padding:1rem 1.2rem}.ticket-head>div{display:flex;flex-direction:column}.ticket-head strong{font-size: var(--text-lg)}.ticket-head span{color:var(--color-text-muted)}.ticket-times{display:grid;grid-template-columns:auto 1fr auto 1fr auto;align-items:center;gap:.65rem;padding:.8rem 1.2rem;text-align:center}.ticket-times>div{display:flex;flex-direction:column}.ticket-times small,.ticket-times span{color:var(--color-text-muted)}.ticket-times strong{font-size: var(--text-lg)}.ticket-times i{height:1px;background:var(--color-border)}.ticket-times b{padding:.5rem .7rem;border:1px solid var(--color-border);border-radius:10px}.ticket-cut{border-top:3px dashed var(--color-border)}.ticket-total{display:flex;justify-content:space-between;padding:.9rem 1.2rem;font-size: var(--text-xl)}.ticket-total strong{font-size: var(--text-xl)}.actions{width:min(100%,500px);margin:1rem auto 0;display:grid;gap:.4rem}
    @media(max-width:959px){.success-page{padding:1.25rem 1rem}.success-content{width:100%}}
  `],
})
export class ParkingSuccessComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ParkingFlowStore);
  readonly query: ParkingFlowQuery = this.store.hasMinimumParkingData()
    ? this.store.fromStore()
    : readParkingFlowQuery(this.route);
  readonly parkingType = OperationType.PARKING;
  startTime(): string {
    const [hours, minutes] = (this.query.endTime || '00:00').split(':').map(Number);
    const end = new Date(2026, 0, 1, hours, minutes);
    end.setMinutes(end.getMinutes() - Number(this.query.minutes || 0));
    return end.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
  }
}
