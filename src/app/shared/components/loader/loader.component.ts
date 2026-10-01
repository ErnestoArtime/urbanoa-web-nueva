import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, effect, inject, input, signal } from '@angular/core';
import type { AnimationItem } from 'lottie-web';

@Component({
  selector: 'app-loader',
  template: `
    <div
      class="loader-overlay"
      [class.loader-overlay-hidden]="!visible()"
      [attr.aria-hidden]="!visible()"
      [attr.aria-busy]="visible()"
      role="status"
      aria-live="polite"
    >
      <div class="loader-dialog">
        <div class="loader-visual" aria-hidden="true">
          @if (!useApkAnimation() || animationFailed() || !animationReady()) {
            <span class="loader-fallback"></span>
          }
          <div
            class="loader-lottie"
            #lottieHost
            [class.loader-lottie-hidden]="!useApkAnimation() || animationFailed() || !animationReady()"
          ></div>
        </div>
        @if (visible() && message()) {
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
        visibility: visible;
        transition: opacity 0.15s ease-out;
      }
      .loader-overlay-hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }
      .loader-dialog {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: min(280px, calc(100vw - 48px));
        height: 140px;
        padding: 20px;
        background: var(--color-surface, #f9faef);
        border-radius: 28px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
      }
      .loader-visual {
        position: relative;
        width: 144px;
        height: 96px;
        display: grid;
        place-items: center;
      }
      .loader-lottie {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        transition: opacity 0.2s ease;
      }
      .loader-lottie-hidden {
        opacity: 0;
      }
      .loader-fallback {
        width: 32px;
        height: 32px;
        border: 3px solid var(--color-border, #d7dccf);
        border-top-color: var(--color-primary, #28736f);
        border-radius: 50%;
        animation: loader-spin 0.9s linear infinite;
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
      @keyframes loader-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .loader-overlay,
        .loader-lottie {
          transition: none;
        }
        .loader-fallback {
          animation: none;
        }
      }
    `,
  ],
})
export class LoaderComponent implements AfterViewInit, OnDestroy {
  @ViewChild('lottieHost', { static: false }) private readonly lottieHost?: ElementRef<HTMLElement>;
  private readonly platformId = inject(PLATFORM_ID);
  private lottieAnimation?: AnimationItem;
  private readonly abortController = new AbortController();
  private destroyed = false;
  private motionPreference?: MediaQueryList;
  private readonly onMotionChange = () => this.updatePlayback();
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
      this.updatePlayback(visible);
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.useApkAnimation()) return;
    if (!this.lottieHost) return;
    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.motionPreference.addEventListener('change', this.onMotionChange);

    void import('lottie-web')
      .then((lottieModule) => {
        if (this.destroyed) return;
        const lottie =
          (lottieModule as { default?: { loadAnimation?: (...args: unknown[]) => unknown } }).default ??
          (lottieModule as unknown as { loadAnimation?: (...args: unknown[]) => unknown });
        if (!lottie?.loadAnimation) {
          this.animationFailed.set(true);
          this.animationReady.set(false);
          return;
        }

        void fetch(this.animationSrc(), { signal: this.abortController.signal })
          .then((response) => {
            if (!response.ok) throw new Error('Animation asset not found');
            return response.json();
          })
          .then((animationData: unknown) => {
            if (this.destroyed) return;
            this.tintAnimationData(animationData);
            this.lottieAnimation = (lottie as { loadAnimation: (...args: unknown[]) => unknown }).loadAnimation({
              container: this.lottieHost!.nativeElement,
              renderer: 'svg',
              loop: true,
              autoplay: false,
              animationData,
              rendererSettings: {
                preserveAspectRatio: 'xMidYMid meet',
              },
            }) as AnimationItem;

            this.lottieAnimation.addEventListener('DOMLoaded', () => {
              if (this.destroyed) return;
              this.lottieAnimation?.setSpeed(0.75);
              this.animationReady.set(true);
              this.updatePlayback();
            });
            this.lottieAnimation.addEventListener('data_failed', () => {
              if (!this.destroyed) this.animationFailed.set(true);
            });
          })
          .catch(() => {
            if (this.destroyed) return;
            this.animationFailed.set(true);
            this.animationReady.set(false);
          });
      })
      .catch(() => {
        if (this.destroyed) return;
        this.animationFailed.set(true);
        this.animationReady.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.abortController.abort();
    this.motionPreference?.removeEventListener('change', this.onMotionChange);
    this.lottieAnimation?.destroy();
    this.lottieAnimation = undefined;
  }

  private updatePlayback(visible = this.visible()): void {
    if (!this.lottieAnimation || !this.animationReady()) return;
    if (!visible) {
      this.lottieAnimation.pause();
    } else if (this.motionPreference?.matches) {
      // A complete logo remains visible without continuous movement.
      this.lottieAnimation.goToAndStop(this.lottieAnimation.totalFrames - 1, true);
    } else {
      this.lottieAnimation.goToAndPlay(0, true);
    }
  }

  private tintAnimationData(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach((item) => this.tintAnimationData(item));
      return;
    }
    if (!value || typeof value !== 'object') return;

    const node = value as Record<string, unknown>;
    if ((node['ty'] === 'gs' || node['ty'] === 'gf') && node['g'] && typeof node['g'] === 'object') {
      const gradient = node['g'] as { p?: number; k?: { a?: number; k?: unknown } };
      const stops = gradient.k?.k;
      if (gradient.k?.a === 0 && Array.isArray(stops) && typeof gradient.p === 'number') {
        // Fade from the exact logo green into the dialog, rather than overlaying a dark band.
        for (let index = 0; index < gradient.p * 4; index += 4) {
          const opacityIndex = gradient.p * 4 + (index / 4) * 2 + 1;
          const startsAtLogo = stops[opacityIndex] === 1;
          stops[index + 1] = (startsAtLogo ? 40 : 247) / 255;
          stops[index + 2] = (startsAtLogo ? 115 : 248) / 255;
          stops[index + 3] = (startsAtLogo ? 111 : 239) / 255;
          if (opacityIndex < stops.length) stops[opacityIndex] = 1;
        }
      }
    }
    if ((node['ty'] === 'fl' || node['ty'] === 'st') && node['c'] && typeof node['c'] === 'object') {
      const color = node['c'] as Record<string, unknown>;
      color['a'] = 0;
      color['k'] = [40 / 255, 115 / 255, 111 / 255, 1];
    }
    Object.values(node).forEach((child) => this.tintAnimationData(child));
  }
}
