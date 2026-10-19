import { ValidatorFn } from '@angular/forms';

/** Validator.isValidPasswordLength/isSecurePassword in the 24 September APK. */
export function isValidApkPassword(password: string): boolean {
  return password.length >= 6 && /[0-9]/.test(password);
}

export const apkPasswordValidator: ValidatorFn = (control) =>
  isValidApkPassword(String(control.value ?? '')) ? null : { apkPassword: true };
