import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable } from '@angular/core';

export type RuntimeStyles = Readonly<Record<string, string | number | null | undefined>>;

export interface RuntimeStyleBinding {
  update(styles: RuntimeStyles): void;
  destroy(): void;
}

interface ElementStyles {
  rule: CSSStyleRule;
  owners: Map<symbol, RuntimeStyles>;
  applied: Map<string, string>;
}

/** Continuous UI values live in a shared stylesheet, never in a style attribute. */
@Injectable({ providedIn: 'root' })
export class RuntimeStyleRegistry {
  private readonly document = inject(DOCUMENT);
  private readonly elements = new WeakMap<Element, ElementStyles>();
  private sheet?: CSSStyleSheet;
  private styleElement?: HTMLStyleElement;
  private sequence = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.styleElement?.remove());
  }

  bind(element: Element): RuntimeStyleBinding {
    if (!this.document.defaultView) return { update: () => undefined, destroy: () => undefined };
    let entry = this.elements.get(element);
    if (!entry) {
      const sheet = this.getSheet();
      const id = String(++this.sequence);
      element.setAttribute('data-runtime-style', id);
      // The ID branch preserves priority over component selectors without
      // adding an ID to the element or using !important.
      const index = sheet.insertRule(`:is(#urbanoa-runtime-style, [data-runtime-style="${id}"]) {}`, sheet.cssRules.length);
      entry = { rule: sheet.cssRules[index] as CSSStyleRule, owners: new Map(), applied: new Map() };
      this.elements.set(element, entry);
    }
    const current = entry;
    const owner = Symbol();
    current.owners.set(owner, {});
    let destroyed = false;
    return {
      update: (styles) => {
        if (destroyed) return;
        current.owners.set(owner, styles);
        this.apply(current);
      },
      destroy: () => {
        if (destroyed) return;
        destroyed = true;
        current.owners.delete(owner);
        if (current.owners.size) {
          this.apply(current);
          return;
        }
        const sheet = this.getSheet();
        const index = Array.from(sheet.cssRules).indexOf(current.rule);
        if (index >= 0) sheet.deleteRule(index);
        element.removeAttribute('data-runtime-style');
        this.elements.delete(element);
      },
    };
  }

  private getSheet(): CSSStyleSheet {
    if (!this.sheet) {
      const style = this.document.createElement('style');
      style.setAttribute('data-urbanoa-runtime-styles', '');
      this.document.head.appendChild(style);
      this.styleElement = style;
      this.sheet = style.sheet as CSSStyleSheet;
    }
    return this.sheet;
  }

  private apply(entry: ElementStyles): void {
    const next = new Map<string, string>();
    for (const styles of entry.owners.values()) {
      for (const [property, value] of Object.entries(styles)) {
        if (!/^(?:--[a-z0-9-]+|width|height|left|background)$/.test(property)) continue;
        if (value !== null && value !== undefined && value !== '') next.set(property, String(value));
      }
    }
    for (const property of entry.applied.keys()) {
      if (!next.has(property)) entry.rule.style.removeProperty(property);
    }
    for (const [property, value] of next) {
      if (entry.applied.get(property) !== value) entry.rule.style.setProperty(property, value);
    }
    entry.applied = next;
  }
}
