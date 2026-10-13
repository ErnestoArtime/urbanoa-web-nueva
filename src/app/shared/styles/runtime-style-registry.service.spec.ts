import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { RuntimeStyleRegistry } from './runtime-style-registry.service';

describe('RuntimeStyleRegistry', () => {
  let registry: RuntimeStyleRegistry;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    registry = TestBed.inject(RuntimeStyleRegistry);
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => element?.remove());

  const ruleCount = () => {
    const sheet = document.querySelector<HTMLStyleElement>('style[data-urbanoa-runtime-styles]')?.sheet;
    return sheet?.cssRules.length ?? 0;
  };

  it('applies continuous values without an inline style attribute', () => {
    const binding = registry.bind(element);
    binding.update({ width: '73px', '--ticket-progress': 42 });
    expect(getComputedStyle(element).width).toBe('73px');
    expect(getComputedStyle(element).getPropertyValue('--ticket-progress').trim()).toBe('42');
    expect(element.hasAttribute('style')).toBeFalse();
    binding.destroy();
  });

  it('shares one rule across independent bindings and preserves surviving owners', () => {
    const header = registry.bind(element);
    const cut = registry.bind(element);
    header.update({ '--ticket-header-color': 'red' });
    cut.update({ '--ticket-cut-y': '140px' });
    expect(ruleCount()).toBe(1);
    expect(getComputedStyle(element).getPropertyValue('--ticket-header-color').trim()).toBe('red');
    expect(getComputedStyle(element).getPropertyValue('--ticket-cut-y').trim()).toBe('140px');
    cut.destroy();
    expect(getComputedStyle(element).getPropertyValue('--ticket-header-color').trim()).toBe('red');
    expect(getComputedStyle(element).getPropertyValue('--ticket-cut-y').trim()).toBe('');
    header.destroy();
  });

  it('removes obsolete values and releases rules when views are destroyed', () => {
    const binding = registry.bind(element);
    binding.update({ width: '73px', '--ticket-progress': 42 });
    binding.update({ '--ticket-progress': null });
    expect(getComputedStyle(element).getPropertyValue('--ticket-progress').trim()).toBe('');
    binding.destroy();
    binding.destroy();
    binding.update({ width: '99px' });
    expect(ruleCount()).toBe(0);
    expect(element.hasAttribute('data-runtime-style')).toBeFalse();
  });

  it('updates a rule in place instead of growing the sheet during dragging', () => {
    const binding = registry.bind(element);
    for (let value = 0; value < 100; value++) binding.update({ left: `${value}px` });
    expect(ruleCount()).toBe(1);
    expect(getComputedStyle(element).left).toBe('99px');
    binding.destroy();
  });

  it('discards unsupported properties and never interprets values as selectors', () => {
    const binding = registry.bind(element);
    binding.update({ position: 'fixed', background: 'red; } body { display: none' });
    expect(getComputedStyle(element).position).toBe('static');
    expect(ruleCount()).toBe(1);
    binding.destroy();
  });
});
