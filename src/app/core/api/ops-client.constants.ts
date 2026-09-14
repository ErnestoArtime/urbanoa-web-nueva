export const OPS_OPERATING_SYSTEMS = {
  android: 1,
  ios: 2,
  web: 3,
} as const;

// The Swagger contract defines 3 as the web client. This value is sent to
// payment/refund and account endpoints that need to identify the platform.
export const OPS_OPERATING_SYSTEM = OPS_OPERATING_SYSTEMS.web;
export const OPS_APP_VERSION = '4.0.0';
