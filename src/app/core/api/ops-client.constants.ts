export const OPS_OPERATING_SYSTEMS = {
  android: 1,
  ios: 2,
  web: 3,
} as const;

export const OPS_OPERATING_SYSTEM = OPS_OPERATING_SYSTEMS.web;

// Keep the legacy value for flows without a verified successful web operation.
export const OPS_UNVERIFIED_OPERATING_SYSTEM = OPS_OPERATING_SYSTEMS.android;

// Web login, parking, extension and unparking were verified against OPS on
// 2026-10-02. Swagger still needs to document web support for confirmations.
export const OPS_PARKING_SESSION_OPERATING_SYSTEM = OPS_OPERATING_SYSTEM;
export const OPS_APP_VERSION = '4.0.0';

const DEVICE_TOKEN_KEY = 'urbanoa.deviceToken';

/** Device/cloud token expected by OPS parking confirmation endpoints. */
export function getOpsCloudToken(): string {
  try {
    const existing = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (existing) return existing;
    const token = crypto.randomUUID?.() ?? `device-${Date.now()}`;
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
    return token;
  } catch {
    return `device-${Date.now()}`;
  }
}
