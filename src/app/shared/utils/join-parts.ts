export function joinParts(parts: readonly (string | null | undefined)[], separator = ' · '): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(separator);
}
