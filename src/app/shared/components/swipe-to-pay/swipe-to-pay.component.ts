import { RuntimeStyleDirective } from '../../directives/runtime-style.directive';
import { Component, computed, inject, input, output, signal, ElementRef, ViewChild } from '@angular/core';
import { AppIconComponent } from '../../icons/app-icon.component';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-swipe-to-pay',
  standalone: true,
  imports: [RuntimeStyleDirective, AppIconComponent],
  template: `
    <div class="swipe-area" #swipeArea>
      <div
        class="swipe-track"
        role="button"
        [attr.aria-label]="displayLabel()"
        [attr.aria-disabled]="disabled() || swipeComplete()"
        tabindex="0"
        (keydown.enter)="confirmByKeyboard()"
        (keydown.space)="$event.preventDefault(); confirmByKeyboard()"
      >
        <div class="swipe-progress" [appRuntimeStyle]="{ width: swipeProgress() + 'px' }"></div>
        <div
          class="swipe-thumb"
          [class.dragging]="dragging()"
          [class.success]="swipeComplete()"
          [class.disabled]="disabled()"
          (pointerdown)="startSwipe($event)"
          [appRuntimeStyle]="{ left: thumbX() + 'px' }"
        >
          <app-icon name="chevron" [stroke]="false" />
        </div>
        <span class="swipe-label">{{ displayLabel() }}</span>
      </div>
      @if (disabled()) {
        <p class="swipe-disabled-hint">{{ disabledHint() }}</p>
      }
    </div>
  `,
  styleUrl: './swipe-to-pay.component.css',
})
export class SwipeToPayComponent {
  @ViewChild('swipeArea') swipeArea!: ElementRef<HTMLElement>;
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
  readonly thumbX = signal(4);
  readonly swipeProgress = signal(50);
  readonly dragging = signal(false);

  private pointerStartX = 0;
  private initialThumbX = 4;

  readonly isDisabled = computed(() => this.disabled() || this.swipeComplete());

  reset(): void {
    this.thumbX.set(4);
    this.swipeProgress.set(50);
    this.swipeComplete.set(false);
  }

  confirmByKeyboard(): void {
    if (this.isDisabled()) return;
    this.completeSwipe();
  }

  startSwipe(event: PointerEvent): void {
    if (this.isDisabled()) return;
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
    if (this.thumbX() >= maxX * 0.75) {
      this.completeSwipe();
      return;
    }
    this.thumbX.set(4);
    this.swipeProgress.set(50);
  }

  private completeSwipe(): void {
    const maxX = this.trackWidth() - 48;
    this.thumbX.set(maxX);
    this.swipeProgress.set(this.trackWidth());
    this.swipeComplete.set(true);
    this.complete.emit();
  }

  private trackWidth(): number {
    return this.swipeArea?.nativeElement?.querySelector('.swipe-track')?.getBoundingClientRect().width ?? 320;
  }
}
