export const OPS_OPERATING_SYSTEMS = {
  android: 1,
  ios: 2,
  web: 3,
} as const;

// OPS currently validates parking confirmations as mobile requests. Keep this
// separate from the web value used by login/refund until the backend exposes
// an explicit web value for these endpoints.
export const OPS_OPERATING_SYSTEM = OPS_OPERATING_SYSTEMS.web;
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
