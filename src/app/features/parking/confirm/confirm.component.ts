import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MOCK_WALLET } from '../../../shared/mock-data';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { readParkingFlowQuery } from '../parking-flow.model';

@Component({
  selector: 'app-parking-confirm',
  imports: [RouterLink, LoaderComponent],
  template: `
    <div class="page flow-page confirm-page">
      <app-loader [visible]="loading()" message="Confirmando aparcamiento..." imageSrc="/assets/brand/login-logo.jpg" />
      <a routerLink="/app/parking/time-steps" [queryParams]="query" class="back-link">‹ Cambiar duración</a>
      <p class="flow-step">Paso 4 de 5</p>
      <h1 class="page-title">Confirmar aparcamiento</h1>

      <div class="card summary">
        <div class="zone-heading"><span [style.background]="sectorColor()"></span><div><strong>{{ query.zone }}</strong><p>{{ query.street }} · {{ query.cityName }}</p></div></div>
        <p><span>Vehículo</span><strong>{{ query.plate }}</strong></p>
        <p><span>Duración</span><strong>{{ query.duration }} · hasta {{ query.endTime }}</strong></p>
        <p><span>Tarifa</span><strong>{{ query.tariff }}</strong></p>
        <p class="total-row"><span>Importe</span><strong>{{ query.amount }}</strong></p>
      </div>

      <div class="card payment-section">
        <p class="section-label">Método de pago</p>
        <button type="button" class="payment-method" [class.active]="paymentMethod() === 'balance'" (click)="paymentMethod.set('balance')">
          <span class="payment-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 7.5h14a2 2 0 0 1 2 2v8H6a3 3 0 0 1-3-3v-9a2.5 2.5 0 0 1 2.5-2.5H17v4.5"/><path d="M15 12h5"/><circle cx="15" cy="12" r=".7"/></svg></span>
          <span class="payment-info"><strong>Monedero</strong><small>{{ wallet.balance.toFixed(2) }} € disponibles</small></span>
          <span class="radio-btn" [class.selected]="paymentMethod() === 'balance'"></span>
        </button>
        <button type="button" class="payment-method" [class.active]="paymentMethod() === 'card'" (click)="paymentMethod.set('card')">
          <span class="card-brand"><img [src]="cardBrandAsset()" [alt]="wallet.mainCard.brand" /></span>
          <span class="payment-info"><strong>{{ wallet.mainCard.brand }} •••• {{ wallet.mainCard.last4 }}</strong><small>Expira {{ wallet.mainCard.expiryDate }}</small></span>
          <span class="radio-btn" [class.selected]="paymentMethod() === 'card'"></span>
        </button>
        <button type="button" class="payment-method" [class.active]="paymentMethod() === 'mixed'" (click)="paymentMethod.set('mixed')">
          <span class="payment-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="14" height="10" rx="2"/><path d="M7 9h6M8 19h11a2 2 0 0 0 2-2V9"/></svg></span>
          <span class="payment-info"><strong>Pago combinado</strong><small>Monedero + tarjeta</small></span>
          <span class="radio-btn" [class.selected]="paymentMethod() === 'mixed'"></span>
        </button>
      </div>

      <div class="swipe-area" #swipeArea>
        <div class="swipe-track">
          <div class="swipe-progress" [style.width.px]="swipeProgress()"></div>
          <div class="swipe-thumb" [class.dragging]="dragging()" [class.success]="swipeComplete()" [style.left.px]="thumbX()" (pointerdown)="startSwipe($event)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 7 7-7 7"/></svg>
          </div>
          <span class="swipe-label">{{ swipeComplete() ? 'Completado' : 'Desliza para pagar' }}</span>
        </div>
      </div>
      <a routerLink="/app/account/payment-methods" class="change-payment">Cambiar método de pago</a>
    </div>
  `,
  styles: [`
    :host{display:block}.flow-page{max-width:680px}.back-link{display:inline-block;margin-bottom:.65rem}.flow-step{color:var(--color-primary);font-size:.72rem;font-weight:800;text-transform:uppercase}.page-title{margin-bottom:.8rem}.summary{padding:.85rem 1rem}.summary>p{display:flex;justify-content:space-between;gap:1rem;padding:.48rem 0;border-bottom:1px solid var(--color-border)}.summary>p span{color:var(--color-text-muted)}.summary>p.total-row{border-bottom:none;padding-bottom:0}.summary>p.total-row strong{color:var(--color-primary);font-size:1.1rem}.zone-heading{display:flex;gap:.8rem;padding-bottom:.4rem}.zone-heading>span{width:8px;border-radius:99px}.zone-heading p{color:var(--color-text-muted)}
    .payment-section{padding:.65rem;margin-top:.7rem}.section-label{font-size:.72rem;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em;margin:0 .35rem .3rem}.payment-method{width:100%;display:flex;align-items:center;gap:.7rem;padding:.48rem .55rem;border:0;border-radius:11px;background:transparent;color:inherit;text-align:left;cursor:pointer;transition:background .15s}.payment-method:hover,.payment-method.active{background:var(--color-background)}.payment-icon,.card-brand{width:38px;height:28px;display:grid;place-items:center;flex:none}.payment-icon svg{width:24px;height:24px;fill:none;stroke:var(--color-primary);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.card-brand img{display:block;max-width:38px;max-height:25px}.payment-info{flex:1;display:flex;flex-direction:column}.payment-info small{color:var(--color-text-muted);font-size:.72rem}.radio-btn{width:20px;height:20px;border:2px solid var(--color-border);border-radius:50%;background:var(--color-surface);flex:none}.radio-btn.selected{border-color:var(--color-primary);background:var(--color-primary);box-shadow:inset 0 0 0 3px var(--color-surface)}
    .swipe-area{margin-top:.7rem}.swipe-track{position:relative;height:54px;border:1px solid var(--color-border);border-radius:999px;background:var(--color-surface);overflow:hidden;display:flex;align-items:center}.swipe-progress{position:absolute;inset:0 auto 0 0;min-width:52px;border-radius:inherit;background:linear-gradient(90deg,var(--color-primary),#4b9b96);transition:width .12s ease-out}.swipe-thumb{position:absolute;top:4px;width:44px;height:44px;border-radius:50%;background:#fff;display:grid;place-items:center;cursor:grab;box-shadow:0 2px 8px rgba(0,0,0,.22);z-index:2;transition:left .12s ease-out;touch-action:none}.swipe-thumb.dragging{cursor:grabbing;transition:none}.swipe-thumb.success{background:var(--color-success)}.swipe-thumb svg{display:block;width:25px;height:25px;fill:none;stroke:var(--color-primary);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}.swipe-thumb.success svg{stroke:#fff}.swipe-label{position:relative;z-index:1;width:100%;padding-left:48px;text-align:center;color:var(--color-primary-dark);font-weight:800;font-size:.88rem;pointer-events:none;mix-blend-mode:multiply}.change-payment{display:block;margin-top:.35rem;text-align:center;font-size:.8rem}
    @media(min-width:768px) and (max-height:950px){.confirm-page{padding-top:1rem;padding-bottom:.8rem}.back-link{margin-bottom:.35rem}.page-title{font-size:1.35rem;margin-bottom:.55rem}.summary{padding:.65rem .9rem}.summary>p{padding:.34rem 0}.zone-heading{padding-bottom:.25rem}.payment-section{margin-top:.55rem;padding:.45rem .6rem}.payment-method{padding:.35rem .5rem}.swipe-area{margin-top:.55rem}.swipe-track{height:50px}.swipe-thumb{width:40px;height:40px}.swipe-progress{min-width:48px}}
  `],
})
export class ParkingConfirmComponent {
  @ViewChild('swipeArea') swipeArea!: ElementRef<HTMLElement>;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly query = readParkingFlowQuery(this.route);
  readonly wallet = MOCK_WALLET;
  readonly paymentMethod = signal<'balance' | 'card' | 'mixed'>('balance');
  readonly loading = signal(false);
  readonly thumbX = signal(4);
  readonly swipeProgress = signal(50);
  readonly dragging = signal(false);
  readonly swipeComplete = signal(false);
  private pointerStartX = 0;
  private initialThumbX = 4;

  cardBrandAsset(): string {
    return this.wallet.mainCard.brand.toLowerCase().includes('master') ? '/assets/payment/mastercard.svg' : '/assets/payment/visa.svg';
  }
  sectorColor(): string { return this.query.sectorColor ? `#${this.query.sectorColor.replace('#', '')}` : 'var(--color-primary)'; }

  startSwipe(event: PointerEvent): void {
    if (this.loading() || this.swipeComplete()) return;
    event.preventDefault();
    this.dragging.set(true);
    this.pointerStartX = event.clientX;
    this.initialThumbX = this.thumbX();
    const move = (moveEvent: PointerEvent) => this.moveSwipe(moveEvent);
    const end = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', end);
      this.endSwipe();
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', end, { once: true });
  }

  private moveSwipe(event: PointerEvent): void {
    if (!this.dragging()) return;
    const trackWidth = this.trackWidth();
    const maxX = trackWidth - 48;
    const nextX = Math.max(4, Math.min(this.initialThumbX + event.clientX - this.pointerStartX, maxX));
    this.thumbX.set(nextX);
    this.swipeProgress.set(nextX + 48);
  }

  private endSwipe(): void {
    if (!this.dragging()) return;
    this.dragging.set(false);
    const maxX = this.trackWidth() - 48;
    if (this.thumbX() >= maxX * .75) {
      this.thumbX.set(maxX);
      this.swipeProgress.set(this.trackWidth());
      this.swipeComplete.set(true);
      setTimeout(() => this.confirmParking(), 350);
      return;
    }
    this.thumbX.set(4);
    this.swipeProgress.set(50);
  }

  private trackWidth(): number { return this.swipeArea?.nativeElement.querySelector('.swipe-track')?.getBoundingClientRect().width ?? 320; }
  private confirmParking(): void {
    this.loading.set(true);
    setTimeout(() => void this.router.navigate(['/app/parking/success'], { queryParams: this.query }), 1500);
  }
}
