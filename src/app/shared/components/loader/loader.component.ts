import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, effect, inject, input, signal } from '@angular/core';
import type { AnimationItem } from 'lottie-web';

@Component({
  selector: 'app-loader',
  template: `
    <div class="loader-overlay" [class.loader-overlay-hidden]="!visible()" role="status" aria-live="polite">
      <div class="loader-dialog">
        <div class="loader-visual">
          <div
            class="loader-lottie"
            #lottieHost
            [class.loader-lottie-hidden]="!useApkAnimation() || animationFailed() || !animationReady()"
          ></div>
        </div>
        @if (message()) {
          <p class="loader-message sr-only">{{ message() }}</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .loader-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.32);
        animation: fadeIn 0.15s ease-out;
        transition: opacity 0.15s ease-out;
      }
      .loader-overlay-hidden {
        opacity: 0;
        pointer-events: none;
      }
      .loader-dialog {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: min(320px, calc(100vw - 48px));
        height: 150px;
        padding: 18px 28px;
        background: var(--color-surface, #f9faef);
        border-radius: 28px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
      }
      .loader-visual {
        position: relative;
        width: 190px;
        height: 110px;
        display: grid;
        place-items: center;
      }
      .loader-lottie {
        position: absolute;
        inset: 0;
        width: 190px;
        height: 110px;
        transition: opacity 0.2s ease;
      }
      .loader-lottie-hidden {
        opacity: 0;
      }
      :host ::ng-deep .loader-lottie svg path {
        fill: var(--color-primary, #2b6767) !important;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
})
export class LoaderComponent implements AfterViewInit, OnDestroy {
  @ViewChild('lottieHost', { static: false }) private readonly lottieHost?: ElementRef<HTMLElement>;
  private readonly platformId = inject(PLATFORM_ID);
  private lottieAnimation?: AnimationItem;
  readonly animationFailed = signal(false);
  readonly animationReady = signal(false);

  visible = input(false);
  message = input('');
  useApkAnimation = input(true);
  animationSrc = input('/assets/brand/logo_animated.json');
  imageSrc = input<string | null>(null);

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const visible = this.visible();
      const animation = this.lottieAnimation;
      if (!animation) return;
      if (visible) {
        animation.goToAndPlay(0, true);
      } else {
        animation.pause();
      }
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.useApkAnimation()) return;
    if (!this.lottieHost) return;

    void import('lottie-web')
      .then((lottieModule) => {
        const lottie =
          (lottieModule as { default?: { loadAnimation?: (...args: unknown[]) => unknown } }).default ??
          (lottieModule as unknown as { loadAnimation?: (...args: unknown[]) => unknown });
        if (!lottie?.loadAnimation) {
          this.animationFailed.set(true);
          this.animationReady.set(false);
          return;
        }

        void fetch(this.animationSrc())
          .then((response) => {
            if (!response.ok) throw new Error('Animation asset not found');
            return response.json();
          })
          .then((animationData: unknown) => {
            this.tintAnimationData(animationData);
            this.lottieAnimation = (lottie as { loadAnimation: (...args: unknown[]) => unknown }).loadAnimation({
              container: this.lottieHost!.nativeElement,
              renderer: 'svg',
              loop: true,
              autoplay: this.visible(),
              animationData,
              rendererSettings: {
                preserveAspectRatio: 'xMidYMid meet',
              },
            }) as AnimationItem;

            this.lottieAnimation.addEventListener('DOMLoaded', () => {
              this.lottieAnimation?.setSpeed(0.75);
              this.lottieAnimation?.setSegment(0, 44);
              this.animationReady.set(true);
              if (this.visible()) {
                this.lottieAnimation?.goToAndPlay(0, true);
              } else {
                this.lottieAnimation?.pause();
              }
            });
          })
          .catch(() => {
            this.animationFailed.set(true);
            this.animationReady.set(false);
          });
      })
      .catch(() => {
        this.animationFailed.set(true);
        this.animationReady.set(false);
      });
  }

  ngOnDestroy(): void {
    this.lottieAnimation?.destroy();
    this.lottieAnimation = undefined;
  }

  private tintAnimationData(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach((item) => this.tintAnimationData(item));
      return;
    }
    if (!value || typeof value !== 'object') return;

    const node = value as Record<string, unknown>;
    if ((node['ty'] === 'fl' || node['ty'] === 'st') && node['c'] && typeof node['c'] === 'object') {
      const color = node['c'] as Record<string, unknown>;
      color['a'] = 0;
      color['k'] = [43 / 255, 103 / 255, 103 / 255, 1];
    }
    Object.values(node).forEach((child) => this.tintAnimationData(child));
  }
}
