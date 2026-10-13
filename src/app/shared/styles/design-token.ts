/** Resolves a CSS design token for external SDKs that require an actual color. */
export function readDesignToken(name: `--${string}`): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
