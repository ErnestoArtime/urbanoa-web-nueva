import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

/** Keeps a ticket's side notches aligned with its real separator position. */
@Directive({
  selector: '[appTicketCutAlign]',
})
export class TicketCutAlignDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private resizeObserver?: ResizeObserver;
  private animationFrame?: number;

  ngAfterViewInit(): void {
    const separator = this.host.querySelector<HTMLElement>('[data-ticket-cut]');
    if (!separator) return;

    const updateCutPosition = () => {
      this.animationFrame = undefined;
      const hostRect = this.host.getBoundingClientRect();
      const separatorRect = separator.getBoundingClientRect();
      const separatorCenter = separatorRect.top - hostRect.top + separatorRect.height / 2;
      this.host.style.setProperty('--ticket-cut-y', `${separatorCenter}px`);
    };

    const scheduleUpdate = () => {
      if (this.animationFrame !== undefined) cancelAnimationFrame(this.animationFrame);
      this.animationFrame = requestAnimationFrame(updateCutPosition);
    };

    this.resizeObserver = new ResizeObserver(scheduleUpdate);
    this.resizeObserver.observe(this.host);
    this.resizeObserver.observe(separator);
    scheduleUpdate();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.animationFrame !== undefined) cancelAnimationFrame(this.animationFrame);
  }
}
