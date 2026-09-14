import { readFileSync } from 'node:fs';

// Regression gate for the copy changed by the September APK-v3 review.
const keys = [
  "account.refund.confirmDetail",
  "account.refund.explanation",
  "account.refund.calculating",
  "account.refund.error",
  "account.refund.destinationManaged",
  "account.refund.confirm",
  "account.refund.request",
  "account.refund.successTitle",
  "account.refund.successDetail",
  "onboarding.notification.webNotice",
  "onboarding.notification.saveError",
  "onboarding.notification.savePreferences",
  "ops.report.unavailableTitle",
  "ops.report.unavailableDetail",
  "ops.report.backToReport",
  "ops.report.openPdf",
  "parking.success.receiptPending",
  "parking.success.receiptPendingDetail",
  "parking.success.startsLater",
  "common.retry",
  "ops.fineDetail.fineNumber",
  "ops.fineDetail.earlyPaymentEnd",
  "ops.detail.operationId",
  "ops.detail.paymentMethod",
  "ops.detail.datetime",
  "ops.detail.amount",
  "ops.detail.balanceAfterTopUp",
  "wallet.movement.topUp",
  "ops.fineDetail.statusMessage.2"
];
let failed = false;
const remaining = {};
for (const lang of ['es', 'eu', 'fr', 'uk']) {
  const catalogue = JSON.parse(readFileSync(new URL(`../public/assets/i18n/${lang}.json`, import.meta.url), 'utf8'));
  const placeholders = Object.entries(catalogue).filter(([, value]) => /^(es|eu|fr|uk)_/.test(value)).map(([key]) => key);
  remaining[lang] = placeholders;
  for (const key of keys) {
    if (!catalogue[key] || /^(es|eu|fr|uk)_/.test(catalogue[key])) {
      console.error(`${lang}: missing translation for ${key}`);
      failed = true;
    }
  }
}
console.log('Pending catalogue placeholders:', Object.fromEntries(Object.entries(remaining).map(([lang, keys]) => [lang, keys.length])));
if (process.argv.includes('--list')) console.log(JSON.stringify(remaining, null, 2));
if (process.argv.includes('--strict') && Object.values(remaining).some(keys => keys.length)) failed = true;
process.exitCode = failed ? 1 : 0;
