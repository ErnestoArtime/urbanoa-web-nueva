export const OPS_OPERATING_SYSTEMS = {
  android: 1,
  ios: 2,
  web: 3,
} as const;

// Keep the app id (Android = 1). The Swagger contract only accepts 1
// (Android) or 2 (iOS) on parking/fine confirm endpoints; 3 (web) is only
// valid on login/refund, so the web client keeps identifying as the app.
export const OPS_OPERATING_SYSTEM = OPS_OPERATING_SYSTEMS.web;
export const OPS_APP_VERSION = '4.0.0';
