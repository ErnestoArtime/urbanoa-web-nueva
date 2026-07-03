import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { readParkingFlowQuery } from '../parking-flow.model';

interface ParkingTimeOption {
  label: string;
  minutes: number;
}

@Component({
  selector: 'app-parking-time-steps',
  imports: [RouterLink, LoaderComponent],
  template: `
    <app-loader [visible]="loading()" message="Cargando tiempos disponibles..." imageSrc="/assets/brand/login-logo.jpg" />
    <div class="page flow-page">
      <a routerLink="/app/parking/tickets" [queryParams]="query" class="back-link">‹ Cambiar tarifa</a>
      <p class="flow-step">Paso 3 de 5</p>
      <h1 class="page-title">Selecciona la duración</h1>
      <p class="page-subtitle">Elige uno de los tiempos permitidos para esta tarifa.</p>

      <div class="context-card card">
        <span class="sector-mark" [style.background]="sectorColor()"></span>
        <div>
          <strong>{{ query.zone }}</strong>
          <p>{{ query.street }} · {{ query.cityName }}</p>
          <small>{{ query.plate }} · {{ query.tariff }}</small>
        </div>
      </div>

      <div class="time-line card">
        <div><small>Inicio</small><strong>{{ startTime() }}</strong></div>
        <span class="line"></span>
        <div class="duration-pill">{{ selected().label }}</div>
        <span class="line"></span>
        <div><small>Fin</small><strong>{{ endTime() }}</strong></div>
      </div>

      <section class="time-selector" aria-label="Selector de duración">
        <button type="button" class="step-control" aria-label="Reducir duración" (click)="changeTime(-1)" [disabled]="selectedIndex() === 0">−</button>
        <div class="time-wheel" [style.background]="wheelBackground()">
          <div class="wheel-content">
            <small>Tiempo</small>
            <strong>{{ selected().label }}</strong>
            <span>{{ amount() }}</span>
          </div>
        </div>
        <button type="button" class="step-control" aria-label="Aumentar duración" (click)="changeTime(1)" [disabled]="selectedIndex() === times.length - 1">+</button>
      </section>

      <div class="step-options" aria-label="Tiempos disponibles">
        @for (option of times; track option.minutes) {
          <button type="button" [class.active]="option.minutes === selected().minutes" (click)="selected.set(option)">
            {{ option.label }}
          </button>
        }
      </div>

      <div class="price-card card">
        <span>Importe estimado</span>
        <strong>{{ amount() }}</strong>
      </div>
      <a routerLink="/app/parking/confirm" [queryParams]="confirmationParams()" class="btn btn-primary btn-block">Continuar</a>
    </div>
  `,
  styles: [`
    .flow-page{max-width:680px}.back-link{display:inline-block;margin-bottom:1rem}.flow-step{color:var(--color-primary);font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.page-subtitle{margin-top:.35rem}.context-card{display:flex;gap:.8rem;margin:1.2rem 0}.sector-mark{width:8px;border-radius:99px;flex:none}.context-card p,.context-card small{color:var(--color-text-muted)}
    .time-line{display:grid;grid-template-columns:auto 1fr auto 1fr auto;align-items:center;gap:.65rem;text-align:center}.time-line div{display:flex;flex-direction:column}.time-line small{color:var(--color-text-muted)}.time-line strong{font-size:1.15rem}.line{height:1px;background:var(--color-border)}.duration-pill{padding:.45rem .7rem;border:1px solid var(--color-border);border-radius:10px;font-weight:700;background:var(--color-background)}
    .time-selector{display:flex;align-items:center;justify-content:center;gap:1.25rem;margin:1.5rem 0}.time-wheel{width:210px;height:210px;padding:11px;border-radius:50%;box-shadow:0 8px 26px rgba(34,105,105,.16);transition:background .25s ease}.wheel-content{height:100%;border-radius:50%;background:var(--color-surface);display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid var(--color-border)}.wheel-content small{color:var(--color-text-muted);text-transform:uppercase;font-weight:700}.wheel-content strong{font-size:2rem;color:var(--color-primary);margin:.2rem 0}.wheel-content span{font-weight:800}.step-control{width:44px;height:44px;border-radius:50%;border:1px solid var(--color-primary);background:var(--color-surface);color:var(--color-primary);font-size:1.6rem;cursor:pointer}.step-control:disabled{opacity:.3;cursor:not-allowed}
    .step-options{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem;margin-bottom:1.25rem}.step-options button{border:1px solid var(--color-border);border-radius:999px;background:var(--color-surface);padding:.45rem .75rem;cursor:pointer}.step-options button.active{background:var(--color-primary);border-color:var(--color-primary);color:#fff;font-weight:700}.price-card{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}.price-card span{color:var(--color-text-muted)}.price-card strong{font-size:1.3rem;color:var(--color-primary)}
    @media(min-width:768px) and (max-height:950px){.flow-page{padding-top:1rem;padding-bottom:.8rem}.back-link{margin-bottom:.35rem}.page-title{font-size:1.35rem}.page-subtitle{font-size:.85rem}.context-card{margin:.65rem 0;padding:.75rem}.time-line{padding:.65rem}.time-selector{margin:.7rem 0}.time-wheel{width:168px;height:168px;padding:9px}.wheel-content strong{font-size:1.55rem}.step-control{width:40px;height:40px}.step-options{margin-bottom:.65rem}.price-card{padding:.65rem;margin-bottom:.55rem}}
    @media(max-width:520px){.time-wheel{width:175px;height:175px}.time-selector{gap:.75rem}.time-line{gap:.35rem}.duration-pill{padding:.35rem}.flow-page{padding-inline:1rem}}
  `],
})
export class ParkingTimeStepsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly query = readParkingFlowQuery(this.route);
  readonly times: ParkingTimeOption[] = [
    { label: '30 min', minutes: 30 },
    { label: '1 h', minutes: 60 },
    { label: '1 h 30 min', minutes: 90 },
    { label: '2 h', minutes: 120 },
    { label: '3 h', minutes: 180 },
  ];
  readonly selected = signal(this.times[1]);
  readonly selectedIndex = computed(() => this.times.findIndex(option => option.minutes === this.selected().minutes));
  readonly loading = signal(true);
  private readonly startedAt = new Date();

  ngOnInit(): void {
    setTimeout(() => this.loading.set(false), 700);
  }

  changeTime(direction: -1 | 1): void {
    const nextIndex = Math.max(0, Math.min(this.times.length - 1, this.selectedIndex() + direction));
    this.selected.set(this.times[nextIndex]);
  }

  startTime(): string { return this.formatTime(this.startedAt); }
  endTime(): string { return this.formatTime(new Date(this.startedAt.getTime() + this.selected().minutes * 60000)); }
  amount(): string { return `${(this.selected().minutes * this.hourlyPrice() / 60).toFixed(2).replace('.', ',')} €`; }
  sectorColor(): string { return this.query.sectorColor ? `#${this.query.sectorColor.replace('#', '')}` : 'var(--color-primary)'; }
  wheelBackground(): string {
    const progress = ((this.selectedIndex() + 1) / this.times.length) * 360;
    return `conic-gradient(var(--color-primary) 0deg ${progress}deg, var(--color-border) ${progress}deg 360deg)`;
  }
  confirmationParams(): Record<string, string> {
    return { ...this.query, duration: this.selected().label, minutes: String(this.selected().minutes), amount: this.amount(), endTime: this.endTime() };
  }

  private hourlyPrice(): number {
    const parsed = Number((this.query.tariffPrice.match(/[\d,.]+/)?.[0] ?? '0.60').replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0.60;
  }
  private formatTime(date: Date): string { return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }
}
