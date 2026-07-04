import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { OperationsService } from '../../../core/services/operations.service';
import { OperationType } from '../../../shared/models/operation-type';
import { OperationIconComponent } from '../../../shared/components/operation-icon/operation-icon.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector:'app-operations-detail', imports:[DecimalPipe,OperationIconComponent,TranslatePipe],
  template:`
    <div class="page operation-detail-page">
      @if(op();as operation){
        <header class="detail-heading"><app-operation-icon [type]="operation.type"/><div><span>{{ 'ops.detail.title' | translate:{id: id()} }}</span><h1>{{ detailTitle() }}</h1></div></header>
        @if(isTicketOperation()){
          <article class="ticket-card">
            <div class="ticket-accent"></div>
            <div class="ticket-header"><app-operation-icon [type]="operation.type"/><div><strong>{{ operation.plate }}</strong><span>{{ operation.zone }}</span></div><div class="ticket-date"><small>{{ 'ops.detail.date' | translate }}</small><strong>{{ operation.date }}</strong></div></div>
            <div class="ticket-timeline"><div><small>{{ 'ops.detail.start' | translate }}</small><strong>{{ startTime() }}</strong><span>{{ operation.date }}</span></div><i></i><b>{{ duration() }}</b><i></i><div><small>{{ 'ops.detail.end' | translate }}</small><strong>{{ endTime() }}</strong><span>{{ operation.date }}</span></div></div>
            <div class="ticket-cut"></div>
            <div class="ticket-total"><div><span>{{ 'ops.detail.total' | translate }}</span><small>{{ 'ops.detail.paymentMethod' | translate }}</small></div><div><strong>{{ absoluteAmount() | number:'1.2-2' }} €</strong><span>{{ 'ops.detail.wallet' | translate }}</span></div></div>
          </article>
        } @else {
          <article class="info-detail card">
            <div class="transaction"><span>{{ 'ops.detail.transactionId' | translate }}</span><strong>{{ transactionId() }}</strong></div>
            @for(row of detailRows();track row.label){
              <div class="info-row"><span class="row-icon"><svg viewBox="0 0 24 24"><path [attr.d]="row.icon"/></svg></span><div><span>{{ row.label }}</span><strong [class.positive]="row.positive">{{ row.value }}</strong></div></div>
            }
          </article>
        }
      }
    </div>
  `,
  styles:[`
    .operation-detail-page{max-width:760px;margin:0 auto;padding:1.4rem}.detail-heading{display:flex;align-items:center;gap:.8rem;margin-bottom:1.2rem}.detail-heading>div{display:flex;flex-direction:column}.detail-heading span{color:var(--color-text-muted);font-size: var(--text-xs)}.detail-heading h1{font-size: var(--text-xl)}.ticket-card{position:relative;overflow:hidden;border:1px solid var(--color-border);border-radius:16px;background:var(--color-surface);box-shadow:var(--shadow-md)}.ticket-accent{height:14px;background:#248cda}.ticket-header{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.8rem;padding:1.2rem}.ticket-header>div{display:flex;flex-direction:column}.ticket-header>div>strong{font-size: var(--text-lg)}.ticket-header span{color:var(--color-text-muted)}.ticket-date{text-align:right}.ticket-date small{color:var(--color-text-muted)}.ticket-timeline{display:grid;grid-template-columns:auto 1fr auto 1fr auto;align-items:center;gap:.7rem;padding:1rem 1.2rem;text-align:center}.ticket-timeline>div{display:flex;flex-direction:column}.ticket-timeline small,.ticket-timeline span{color:var(--color-text-muted)}.ticket-timeline>div strong{font-size: var(--text-lg)}.ticket-timeline i{height:1px;background:var(--color-border)}.ticket-timeline b{padding:.55rem .75rem;border:1px solid var(--color-border);border-radius:10px}.ticket-cut{height:8px;border-top:3px dashed var(--color-border)}.ticket-total{display:flex;justify-content:space-between;padding:1rem 1.2rem}.ticket-total>div{display:flex;flex-direction:column}.ticket-total>div:last-child{text-align:right}.ticket-total span{font-size: var(--text-base)}.ticket-total strong{font-size: var(--text-xl)}.ticket-total small{margin-top:.25rem;color:var(--color-text-muted)}.info-detail{padding:1.2rem 1.4rem}.transaction{display:flex;flex-direction:column;padding-bottom:1.1rem;border-bottom:1px solid var(--color-border)}.transaction span{font-size: var(--text-base)}.transaction strong{font-weight: var(--font-medium)}.info-row{display:flex;align-items:center;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--color-border)}.info-row:last-child{border:0}.info-row span{flex:1;color:var(--color-text-muted)}.info-row strong{flex:1;text-align:right;font-weight: var(--font-bold)}.info-row strong.positive{color:var(--color-primary)}.row-icon{width:20px;height:20px;fill:var(--color-text-muted);flex:none}.row-icon svg{width:100%;height:100%}
  `]
})
export class OperationsDetailComponent {
  private readonly route=inject(ActivatedRoute);private readonly service=inject(OperationsService);
  readonly id=toSignal(this.route.paramMap.pipe(map(p=>p.get('id')??'1')),{initialValue:'1'});
  readonly op=computed(()=>{this.service.operations();return this.service.getOperationById(this.id());});
  readonly opType=computed(()=>this.op()?.type??OperationType.PARKING);
  readonly detailTitle=computed(()=>{
    const labels:Partial<Record<OperationType,string>>={
      [OperationType.PARKING]:'ops.detail.parkingDetail',[OperationType.PARKING_EXTENSION]:'ops.detail.extension',[OperationType.REFUND]:'ops.detail.parkingEnd',[OperationType.FINE_PAYMENT]:'ops.detail.finePayment',[OperationType.TOP_UP]:'ops.detail.walletRecharge',[OperationType.BALANCE_REFUND]:'ops.detail.balanceRefundLabel',[OperationType.UNPAID_FINES]:'ops.detail.pendingFine'
    };return labels[this.opType()]??'ops.detail';
  });
  readonly isTicketOperation=computed(()=>[OperationType.PARKING,OperationType.PARKING_EXTENSION].includes(this.opType()));
  readonly startTime=()=>this.opType()===OperationType.PARKING?'18:36':'19:40';readonly endTime=()=>this.opType()===OperationType.PARKING?'19:40':'20:10';readonly duration=()=>this.opType()===OperationType.PARKING?'1 h 4 min':'30 min';
  readonly transactionId=computed(()=>`8430${String(370+Number(this.id()))}`);readonly absoluteAmount=computed(()=>Math.abs(this.op()?.amount??0));
  readonly detailRows=computed(()=>{
    const o=this.op();if(!o)return[];const car='M5 17h14v3h-2v-2H7v2H5v-3Zm1-5 2-6h8l2 6M5 12h14v5H5z';const calendar='M4 5h16v16H4zM8 3v4M16 3v4M4 9h16';const clock='M12 7v5l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z';const money='M4 7h16v10H4zM8 12h.01M16 12h.01M12 9v6';
    if(o.type===OperationType.REFUND)return[{label:'ops.detail.plate',value:o.plate??'5678 DEF',icon:car},{label:'ops.detail.datetime',value:o.date,icon:calendar},{label:'ops.detail.totalTime',value:'5 h 45 min',icon:clock},{label:'ops.detail.refund',value:`+${this.absoluteAmount().toFixed(2).replace('.',',')} €`,icon:money,positive:true}];
    if(o.type===OperationType.TOP_UP)return[{label:'ops.detail.datetime',value:o.date,icon:calendar},{label:'ops.detail.paymentMethod',value:'Visa •••• 1234',icon:money},{label:'ops.detail.recharge',value:`+${this.absoluteAmount().toFixed(2).replace('.',',')} €`,icon:money,positive:true}];
    if(o.type===OperationType.FINE_PAYMENT)return[{label:'ops.detail.plate',value:o.plate??'',icon:car},{label:'ops.detail.datetime',value:o.date,icon:calendar},{label:'ops.detail.location',value:o.zone??'',icon:calendar},{label:'ops.detail.total',value:`${this.absoluteAmount().toFixed(2).replace('.',',')} €`,icon:money}];
    return[{label:'ops.detail.datetime',value:o.date,icon:calendar},{label:'ops.detail.balanceRefund',value:`+${this.absoluteAmount().toFixed(2).replace('.',',')} €`,icon:money,positive:true}];
  });
}
