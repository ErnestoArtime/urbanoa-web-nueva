import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ParkingFlowStore } from '../parking-flow.store';

interface WizardStep {
  labelKey: string;
  hintKey: string;
  path: string;
}

@Component({
  selector: 'app-parking-wizard-layout',
  imports: [RouterLink, RouterOutlet, TranslatePipe],
  template: `
    <div class="parking-wizard">
      <aside class="wizard-sidebar">
        <div class="wizard-heading">
          <span class="wizard-kicker">{{ 'parking.wizard.kicker' | translate }}</span>
          <h1>{{ 'parking.wizard.title' | translate }}</h1>
          <p>{{ 'parking.wizard.subtitle' | translate }}</p>
        </div>

        <ol class="wizard-steps" [attr.aria-label]="'parking.wizard.ariaLabel' | translate">
          @for (step of steps; track step.path; let index = $index) {
            <li [class.active]="index === currentStep()" [class.complete]="index < currentStep()">
              @if (index < currentStep()) {
                <a [routerLink]="step.path" [queryParams]="query()" class="step-link">
                  <span class="step-number">✓</span
                  ><span
                    ><strong>{{ step.labelKey | translate }}</strong
                    ><small>{{ step.hintKey | translate }}</small></span
                  >
                </a>
              } @else {
                <div class="step-link">
                  <span class="step-number">{{ index + 1 }}</span
                  ><span
                    ><strong>{{ step.labelKey | translate }}</strong
                    ><small>{{ step.hintKey | translate }}</small></span
                  >
                </div>
              }
            </li>
          }
        </ol>

        @if (query()['cityName'] || query()['plate']) {
          <section class="wizard-summary">
            <span>{{ 'parking.wizard.currentSelection' | translate }}</span>
            @if (query()['cityName']) {
              <p>
                <small>{{ 'parking.wizard.municipio' | translate }}</small
                ><strong>{{ query()['cityName'] }}</strong>
              </p>
            }
            @if (query()['zone']) {
              <p>
                <small>{{ 'common.zone' | translate }}</small
                ><strong>{{ query()['zone'] }}</strong>
              </p>
            }
            @if (query()['plate']) {
              <p>
                <small>{{ 'parking.wizard.vehicle' | translate }}</small
                ><strong>{{ query()['plate'] }}</strong>
              </p>
            }
            @if (query()['duration']) {
              <p>
                <small>{{ 'parking.wizard.duration' | translate }}</small
                ><strong>{{ query()['duration'] }}</strong>
              </p>
            }
          </section>
        }
      </aside>

      <section class="wizard-detail" [class.map-step]="currentStep() === 0">
        <header class="wizard-mobile-head" [class.map-step]="currentStep() === 0">
          <span>{{ 'parking.wizard.step' | translate: { current: '' + (currentStep() + 1), total: '' + steps.length } }}</span>
          <strong>{{ steps[currentStep()].labelKey | translate }}</strong>
          <div class="mobile-progress"><i [style.width.%]="((currentStep() + 1) / steps.length) * 100"></i></div>
        </header>
        <router-outlet />
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-height: 0;
      }
      .parking-wizard {
        display: flex;
        min-height: 100%;
        flex-direction: column;
      }
      .wizard-sidebar {
        padding: 1rem;
        border-bottom: 1px solid var(--color-border);
        background: var(--color-surface);
      }
      .wizard-heading {
        display: none;
      }
      .wizard-steps {
        display: flex;
        gap: 0.35rem;
        margin: 0;
        padding: 0;
        list-style: none;
        overflow-x: auto;
      }
      .wizard-steps li {
        flex: 1;
        min-width: 42px;
      }
      .step-link {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        color: inherit;
        text-decoration: none;
      }
      .step-link > span:last-child {
        display: none;
      }
      .step-number {
        display: grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border: 1px solid var(--color-border);
        border-radius: 50%;
        background: var(--color-surface);
        color: var(--color-text-muted);
        font-size: var(--text-xs);
        font-weight: var(--font-extra);
      }
      .wizard-steps li.active .step-number {
        border-color: var(--color-primary);
        background: var(--color-active);
        color: var(--color-primary-dark);
        box-shadow: 0 0 0 3px rgba(43, 103, 103, 0.1);
      }
      .wizard-steps li.complete .step-number {
        border-color: var(--color-primary);
        background: var(--color-primary);
        color: #fff;
      }
      .wizard-summary {
        display: none;
      }
      .wizard-detail {
        min-width: 0;
        min-height: 0;
        background: var(--color-background);
      }
      .wizard-mobile-head {
        display: grid;
        gap: 0.2rem;
        padding: 0.7rem 1rem;
        border-bottom: 1px solid var(--color-border);
        background: var(--color-surface);
      }
      .wizard-mobile-head > span {
        color: var(--color-primary);
        font-size: var(--text-2xs);
        font-weight: var(--font-extra);
        text-transform: uppercase;
      }
      .mobile-progress {
        height: 4px;
        margin-top: 0.3rem;
        overflow: hidden;
        border-radius: 99px;
        background: var(--color-border);
      }
      .mobile-progress i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--color-primary);
        transition: width 0.25s ease;
      }
      .wizard-mobile-head.map-step {
        display: none;
      }
      .wizard-detail.map-step {
        display: flex;
        flex-direction: column;
      }
      :host ::ng-deep .wizard-detail.map-step > app-parking-map {
        flex: 1;
        min-height: 0;
      }
      :host ::ng-deep .flow-page {
        margin: 0 auto;
      }
      @media (min-width: 960px) {
        .parking-wizard {
          display: grid;
          grid-template-columns: 290px minmax(0, 1fr);
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }
        .wizard-sidebar {
          display: flex;
          min-height: 0;
          flex-direction: column;
          padding: 1.35rem 1rem;
          overflow-y: auto;
          border-right: 1px solid var(--color-border);
          border-bottom: 0;
        }
        .wizard-heading {
          display: block;
          padding: 0 0.45rem 1rem;
        }
        .wizard-kicker {
          color: var(--color-primary);
          font-size: var(--text-2xs);
          font-weight: var(--font-extra);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .wizard-heading h1 {
          margin: 0.2rem 0;
          font-size: var(--text-xl);
        }
        .wizard-heading p {
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }
        .wizard-steps {
          display: grid;
          gap: 0.25rem;
          overflow: visible;
        }
        .wizard-steps li {
          min-width: 0;
          border-radius: 12px;
        }
        .wizard-steps li.active {
          background: var(--color-active);
          box-shadow: inset 4px 0 0 var(--color-primary);
        }
        .wizard-steps li.complete:hover {
          background: rgba(93, 154, 150, 0.1);
        }
        .step-link {
          justify-content: flex-start;
          padding: 0.7rem 0.75rem;
        }
        .step-link > span:last-child {
          display: flex;
          min-width: 0;
          flex-direction: column;
        }
        .step-link strong {
          font-size: var(--text-sm);
        }
        .step-link small {
          margin-top: 0.08rem;
          overflow: hidden;
          color: var(--color-text-muted);
          font-size: var(--text-2xs);
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .wizard-summary {
          display: grid;
          gap: 0.55rem;
          margin-top: auto;
          padding: 1rem 0.8rem 0;
          border-top: 1px solid var(--color-border);
        }
        .wizard-summary > span {
          color: var(--color-primary);
          font-size: var(--text-2xs);
          font-weight: var(--font-extra);
          text-transform: uppercase;
        }
        .wizard-summary p {
          display: flex;
          justify-content: space-between;
          gap: 0.6rem;
          font-size: var(--text-xs);
        }
        .wizard-summary small {
          color: var(--color-text-muted);
        }
        .wizard-summary strong {
          overflow: hidden;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .wizard-detail {
          height: calc(100% - 1.1rem);
          margin: 0.55rem;
          overflow-y: auto;
          border: 1px solid var(--color-border);
          border-radius: 22px;
          box-shadow: var(--shadow-sm);
        }
        .wizard-mobile-head {
          display: none;
        }
        :host ::ng-deep .wizard-detail > app-parking-map {
          display: block;
          height: 100%;
        }
      }
    `,
  ],
})
export class ParkingWizardLayoutComponent {
  private readonly router = inject(Router);
  private readonly store = inject(ParkingFlowStore);
  readonly steps: WizardStep[] = [
    { labelKey: 'parking.wizard.step1.label', hintKey: 'parking.wizard.step1.hint', path: '/app/parking' },
    { labelKey: 'parking.wizard.step2.label', hintKey: 'parking.wizard.step2.hint', path: '/app/parking/tickets' },
    { labelKey: 'parking.wizard.step3.label', hintKey: 'parking.wizard.step3.hint', path: '/app/parking/time-steps' },
    { labelKey: 'parking.wizard.step4.label', hintKey: 'parking.wizard.step4.hint', path: '/app/parking/confirm' },
    { labelKey: 'parking.wizard.step5.label', hintKey: 'parking.wizard.step5.hint', path: '/app/parking/success' },
  ];
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  readonly query = computed(() => {
    const urlParams = this.router.parseUrl(this.url()).queryParams as Record<string, string>;
    const s = this.store.vm();
    return {
      ...urlParams,
      ...(s.cityName ? { cityName: s.cityName } : {}),
      ...(s.zoneName ? { zone: s.zoneName } : {}),
      ...(s.plate ? { plate: s.plate } : {}),
      ...(s.duration ? { duration: s.duration } : {}),
    };
  });
  readonly currentStep = computed(() => {
    const path = this.url().split('?')[0];
    if (path.includes('/success')) return 4;
    if (path.includes('/confirm')) return 3;
    if (path.includes('/time-steps')) return 2;
    if (path.includes('/tickets') || path.includes('/ticket')) return 1;
    return 0;
  });
}
