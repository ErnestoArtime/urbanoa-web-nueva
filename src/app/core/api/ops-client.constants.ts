export const OPS_OPERATING_SYSTEMS = {
  android: 1,
  ios: 2,
  web: 3,
} as const;

export const OPS_OPERATING_SYSTEM = OPS_OPERATING_SYSTEMS.web;

// Temporary OPS compatibility: parking confirmations only accept the mobile
// contract and validate it against the operating system used to create the
// session. Login and parking confirmations must therefore use the same value.
export const OPS_PARKING_SESSION_OPERATING_SYSTEM = OPS_OPERATING_SYSTEMS.android;
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
