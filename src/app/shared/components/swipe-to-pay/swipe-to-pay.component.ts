import { Component, computed, input, output, signal, ElementRef, ViewChild, HostListener } from '@angular/core';
import { AppIconComponent } from '../../icons/app-icon.component';

@Component({
  selector: 'app-swipe-to-pay',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <div class="swipe-area" #swipeArea>
      <div class="swipe-track"
        role="button"
        [attr.aria-label]="swipeComplete() ? completedLabel : label()"
        [attr.aria-disabled]="disabled() || swipeComplete()"
        tabindex="0"
        (keydown.enter)="confirmByKeyboard()"
        (keydown.space)="confirmByKeyboard()">
        <div class="swipe-progress" [style.width.px]="swipeProgress()"></div>
        <div class="swipe-thumb"
          [class.dragging]="dragging()"
          [class.success]="swipeComplete()"
          [class.disabled]="disabled()"
          [style.left.px]="thumbX()"
          (pointerdown)="startSwipe($event)">
          <app-icon name="chevron" [stroke]="true" />
        </div>
        <span class="swipe-label">{{ swipeComplete() ? completedLabel : label() }}</span>
      </div>
      @if (disabled()) {
        <p class="swipe-disabled-hint">{{ disabledHint() }}</p>
      }
    </div>
  `,
  styles: [`
    .swipe-area{width:100%}.swipe-track{position:relative;height:54px;border:1px solid var(--color-border);border-radius:999px;background:var(--color-surface);overflow:hidden;display:flex;align-items:center;outline:none}.swipe-track:focus-visible{box-shadow:0 0 0 3px rgba(43,103,103,.35)}.swipe-progress{position:absolute;inset:0 auto 0 0;min-width:52px;border-radius:inherit;background:linear-gradient(90deg,var(--color-primary),#4b9b96);transition:width .12s ease-out}.swipe-thumb{position:absolute;top:4px;width:44px;height:44px;border-radius:50%;background:#fff;display:grid;place-items:center;cursor:grab;box-shadow:0 2px 8px rgba(0,0,0,.22);z-index:2;transition:left .12s ease-out,background .2s;touch-action:none}.swipe-thumb.dragging{cursor:grabbing;transition:none}.swipe-thumb.success{background:var(--color-success);cursor:default}.swipe-thumb.disabled{opacity:.4;cursor:not-allowed}.swipe-thumb svg{display:block;width:25px;height:25px;fill:none;stroke:var(--color-primary);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}.swipe-thumb.success svg{stroke:#fff}.swipe-label{position:relative;z-index:1;width:100%;padding-left:48px;text-align:center;color:var(--color-primary-dark);font-weight:var(--font-extra);font-size:var(--text-sm);pointer-events:none;mix-blend-mode:multiply}.swipe-disabled-hint{margin-top:.4rem;color:var(--color-text-muted);font-size:var(--text-xs);text-align:center}
  `],
})
export class SwipeToPayComponent {
  @ViewChild('swipeArea') swipeArea!: ElementRef<HTMLElement>;

  readonly label = input('Desliza para pagar');
  readonly completedLabel = input('Completado');
  readonly disabled = input(false);
  readonly disabledHint = input('');

  readonly onComplete = output<void>();

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
    if (this.thumbX() >= maxX * .75) {
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
    this.onComplete.emit();
  }

  private trackWidth(): number {
    return this.swipeArea?.nativeElement?.querySelector('.swipe-track')?.getBoundingClientRect().width ?? 320;
  }
}
