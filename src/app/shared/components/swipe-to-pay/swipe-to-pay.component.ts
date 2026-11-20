import { RuntimeStyleDirective } from '../../directives/runtime-style.directive';
import { Component, computed, DestroyRef, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';

const THUMB_INSET = 4;
const THUMB_SIZE = 48;
const RESET_DURATION_MS = 300;

@Component({
  selector: 'app-swipe-to-pay',
  standalone: true,
  imports: [RuntimeStyleDirective],
  template: `
    <div class="swipe-area" #swipeArea>
      <div
        class="swipe-track"
        [class.complete]="swipeComplete()"
        [class.disabled]="disabled()"
        role="button"
        [attr.aria-label]="displayLabel()"
        [attr.aria-disabled]="isDisabled()"
        [tabindex]="disabled() ? -1 : 0"
        [appRuntimeStyle]="{ '--swipe-ratio': ratio() }"
        (keydown.enter)="confirmByKeyboard()"
        (keydown.space)="$event.preventDefault(); confirmByKeyboard()"
      >
        <div
          class="swipe-thumb"
          [class.dragging]="dragging()"
          [class.disabled]="disabled()"
          (pointerdown)="startSwipe($event)"
          [appRuntimeStyle]="{ left: thumbX() + 'px' }"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 17.413H7.326L12.5 11.707L7.326 6H2L7.326 11.707L2 17.413Z" />
            <path d="M12.5 17.413H17.826L23 11.707L17.826 6H12.5L17.826 11.707L12.5 17.413Z" />
          </svg>
        </div>
        <span class="swipe-label">{{ displayLabel() }}</span>
      </div>
      @if (disabled() && disabledHint()) {
        <p class="swipe-disabled-hint">{{ disabledHint() }}</p>
      }
    </div>
  `,
  styleUrl: './swipe-to-pay.component.css',
})
export class SwipeToPayComponent {
  private readonly swipeArea = viewChild.required<ElementRef<HTMLElement>>('swipeArea');
  private readonly translationService = inject(TranslationService);

  readonly label = input<string>();
  readonly completedLabel = input<string>();
  readonly disabled = input(false);
  readonly disabledHint = input('');

  readonly complete = output<void>();
  readonly displayLabel = () =>
    this.swipeComplete()
      ? (this.completedLabel() ?? this.translationService.translate('payment.swipeCompleted'))
      : (this.label() ?? this.translationService.translate('payment.swipeToPay'));

  readonly swipeComplete = signal(false);
  readonly thumbX = signal(THUMB_INSET);
  readonly travel = signal(1);
  readonly dragging = signal(false);
  readonly ratio = computed(() => Math.min(1, Math.max(0, (this.thumbX() - THUMB_INSET) / this.travel())));

  private pointerStartX = 0;
  private initialThumbX = THUMB_INSET;
  private animationFrame = 0;
  private removeListeners: (() => void) | null = null;

  readonly isDisabled = computed(() => this.disabled() || this.swipeComplete());

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      cancelAnimationFrame(this.animationFrame);
      this.removeListeners?.();
    });
  }

  reset(): void {
    this.swipeComplete.set(false);
    this.animateTo(THUMB_INSET);
  }

  confirmByKeyboard(): void {
    if (this.isDisabled()) return;
    this.measure();
    this.completeSwipe();
  }

  startSwipe(event: PointerEvent): void {
    if (this.isDisabled()) return;
    event.preventDefault();
    cancelAnimationFrame(this.animationFrame);
    this.measure();
    this.dragging.set(true);
    this.pointerStartX = event.clientX;
    this.initialThumbX = this.thumbX();
    const move = (moveEvent: PointerEvent) => this.moveSwipe(moveEvent);
    const end = () => {
      this.removeListeners?.();
      this.endSwipe();
    };
    this.removeListeners = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', end);
      document.removeEventListener('pointercancel', end);
      this.removeListeners = null;
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', end);
  }

  private moveSwipe(event: PointerEvent): void {
    if (!this.dragging()) return;
    const maxX = THUMB_INSET + this.travel();
    this.thumbX.set(Math.max(THUMB_INSET, Math.min(this.initialThumbX + event.clientX - this.pointerStartX, maxX)));
  }

  private endSwipe(): void {
    if (!this.dragging()) return;
    this.dragging.set(false);
    if (this.ratio() >= 0.98) {
      this.completeSwipe();
      return;
    }
    this.animateTo(THUMB_INSET);
  }

  private completeSwipe(): void {
    cancelAnimationFrame(this.animationFrame);
    this.thumbX.set(THUMB_INSET + this.travel());
    this.swipeComplete.set(true);
    this.complete.emit();
  }

  private animateTo(target: number): void {
    cancelAnimationFrame(this.animationFrame);
    const from = this.thumbX();
    if (from === target) return;
    const startedAt = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / RESET_DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.thumbX.set(from + (target - from) * eased);
      if (progress < 1) this.animationFrame = requestAnimationFrame(step);
    };
    this.animationFrame = requestAnimationFrame(step);
  }

  private measure(): void {
    const track = this.swipeArea().nativeElement.querySelector('.swipe-track');
    const width = track?.getBoundingClientRect().width ?? 320;
    this.travel.set(Math.max(1, width - THUMB_SIZE - THUMB_INSET * 2));
  }
}
