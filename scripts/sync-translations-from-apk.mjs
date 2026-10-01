import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (!argument.startsWith('--')) continue;
  const name = argument.slice(2);
  const value = process.argv[index + 1]?.startsWith('--') ? true : process.argv[++index];
  args.set(name, value ?? true);
}

const apkPath = path.resolve(String(args.get('apk') || 'PANTALLAS_APK/androidApp-debug (4)_Urbanoa_20260924.apk'));
const aaptPath = path.resolve(String(args.get('aapt') || 'C:/Users/Ernesto/AppData/Local/Android/Sdk/build-tools/36.1.0/aapt2.exe'));
const catalogueDirectory = path.resolve(String(args.get('catalogues') || 'public/assets/i18n'));
const shouldApply = args.has('apply');
const shouldCheck = args.has('check');

const resourceOverrides = new Map([
  ['common.loading', 'common_loading_message'],
  ['auth.login.title', 'login_title'],
  ['auth.login.subtitle', 'login_subtitle'],
  ['auth.login.forgotPassword', 'login_reset_password'],
  ['auth.login.submit', 'login_enter_button'],
  ['auth.register.title', 'register_title'],
  ['auth.register.subtitle', 'register_subtitle'],
  ['auth.register.repeatPassword', 'register_confirm_password_hint'],
  ['auth.confirm.title', 'register_confirm_title'],
  ['auth.confirm.subtitle', 'register_confirm_subtitle'],
  ['auth.confirm.resend', 'register_confirm_resend_button'],
  ['auth.confirm.goToLogin', 'register_confirm_login_button'],
  ['auth.resetCode.title', 'reset_password_code_sent_title'],
  ['auth.resetCode.subtitle', 'reset_password_code_sent_subtitle'],
  ['auth.reset.subtitle', 'reset_password_subtitle'],
  ['auth.resetCode.resend', 'reset_password_code_sent_resend_button'],
  ['auth.resetSuccess.title', 'reset_password_success_title'],
  ['auth.resetSuccess.subtitle', 'reset_password_success_subtitle'],
  ['auth.resetSuccess.login', 'reset_password_success_login_button'],
  ['auth.newPassword.title', 'reset_password_confirm_title'],
  ['auth.newPassword.save', 'reset_password_confirm_save_button'],
  ['account.profile.title', 'profile_title'],
  ['account.notifications.title', 'notifications_title'],
  ['onboarding.location.title', 'onboarding_location_title'],
  ['onboarding.location.subtitle', 'onboarding_location_subtitle'],
  ['onboarding.location.grant', 'onboarding_location_allow_location_button'],
  ['onboarding.location.chooseCity', 'onboarding_location_cancel_button'],
  ['onboarding.ready.title', 'onboarding_ready_title'],
  ['onboarding.ready.subtitle', 'onboarding_ready_subtitle'],
  ['onboarding.user.title', 'onboarding_user_title'],
  ['onboarding.user.subtitle', 'onboarding_user_subtitle'],
  ['onboarding.user.cancel', 'onboarding_user_cancel_button'],
  ['onboarding.payment.title', 'onboarding_payment_title'],
  ['onboarding.payment.subtitle', 'onboarding_payment_subtitle'],
  ['onboarding.payment.addCard', 'onboarding_payment_add_card_button'],
  ['onboarding.payment.skip', 'onboarding_payment_cancel_button'],
  ['onboarding.notification.title', 'onboarding_notification_title'],
  ['onboarding.notification.subtitle', 'onboarding_notification_subtitle'],
  ['onboarding.notification.savePreferences', 'onboarding_notification_enable_button'],
  ['onboarding.notification.cancel', 'onboarding_notification_cancel_button'],
  ['nav.home', 'map_title'],
  ['nav.park', 'cities_title'],
  ['parking.title', 'cities_title'],
  ['parking.wizard.title', 'cities_title'],
  ['breadcrumb.tickets', 'ticket_tariff'],
  ['parking.tickets.vehicle', 'ticket_vehicle'],
  ['parking.selectMunicipio', 'map_select_city'],
  ['parking.tickets.getTicket', 'zones_ticket_button'],
  ['parking.tickets.loading', 'zones_loading_message'],
  ['parking.timeSteps.loading', 'time_steps_loading_message'],
  ['parking.timeSteps.ticketUnavailable', 'map_ticket_not_available'],
  ['parking.confirm.loading', 'park_confirm_loading_message'],
  ['parking.success.title', 'park_success_result_title'],
  ['parking.success.goHome', 'park_success_finish_button'],
  ['dashboard.howToGetThere', 'ticket_get_there'],
  ['payment.free', 'ticket_payment_method_none'],
  ['ops.active', 'operations_current'],
  ['ops.noActive', 'operations_no_current'],
  ['ops.type.extension', 'operations_parking_extension'],
  ['ops.type.parkingEndRefund', 'operations_parking_refund'],
  ['ops.type.balanceRefund', 'operations_balance_refund'],
  ['ops.filterDate', 'operations_filter_title'],
  ['ops.unpaidFines.bannerCount', 'operations_unpaid_fines_counter'],
  ['ops.report', 'report_title'],
  ['ops.report.customDates', 'report_date_filter_custom_dates'],
  ['ops.report.generateButton', 'report_generate_button'],
  ['ops.report.parkingOperationsDesc', 'report_operations_filter_parking_operations_desc'],
  ['ops.report.parkingDesc', 'report_operations_filter_parking_desc'],
  ['ops.report.extensionDesc', 'report_operations_filter_parking_extend_desc'],
  ['ops.report.refundsDesc', 'report_operations_filter_unparking_desc'],
  ['ops.report.topUpsDesc', 'report_operations_filter_top_up_desc'],
  ['ops.report.balanceRefundsDesc', 'report_operations_filter_balance_refund_desc'],
  ['ops.report.finesDesc', 'report_operations_filter_fine_payment_desc'],
  ['ops.report.goToOperations', 'report_success_finish_button'],
  ['ops.detail.extension', 'parking_extension_detail_title'],
  ['ops.detail.balanceRefund', 'balance_refund_detail_title'],
  ['ops.detail.balanceAfterTopUp', 'operation_detail_balance_after_top_up'],
  ['ops.fineDetail.acknowledgedMessage', 'unpaid_fine_detail_successful_history'],
  ['ops.fineDetail.paid', 'unpaid_fine_detail_successful_payment'],
  ['parking.ended', 'unparking_detail_title'],
  ['dashboard.profileCompletion.reviewProfile', 'profile_title'],
  ['parking.timeSteps.start', 'ticket_init_date'],
  ['parking.timeSteps.vehicle', 'operation_detail_plate'],
  ['parking.success.start', 'ticket_init_date'],
  ['parking.ticketDetail.start', 'ticket_init_date'],
  ['parking.ticketDetail.unpark', 'ticket_unpark'],
  ['common.cancel', 'account_cancel_account_dialog_cancel_button'],
  ['common.save', 'add_vehicle_save_button'],
  ['account.changePassword.title', 'account_change_password'],
  ['account.changePassword.confirm', 'change_password_confirm_password_hint'],
  ['account.changePassword.successMessage', 'change_password_success_message'],
  ['account.menu.about', 'account_about'],
  ['account.developedBy', 'about_developed_by'],
  ['account.deleteAccount.warning', 'account_cancel_account_dialog_message'],
  ['account.deleteAccountDetail', 'account_cancel_account_dialog_message'],
  ['account.wallet', 'payment_methods_wallet'],
  ['account.cardsEmpty', 'payment_methods_no_cards'],
  ['account.profile.saveSuccess', 'profile_successful_update'],
  ['account.taxData.saveSuccess', 'tax_data_successful_update'],
  ['account.recharge.title', 'top_up_title'],
  ['account.recharge.amountQuestion', 'top_up_amount'],
  ['account.recharge.cardForRecharge', 'top_up_selected_credit_card_title'],
  ['account.recharge.balanceAfter', 'top_up_balance_after_top_up'],
  ['account.recharge.success', 'top_up_successful_top_up'],
  ['account.refund.title', 'balance_refund_detail_title'],
  ['account.refund.successTitle', 'payment_methods_successful_refund'],
  ['account.support.title', 'support_title'],
  ['account.support.send', 'support_button'],
  ['account.support.newMessage', 'support_new_message'],
  ['account.support.unread', 'support_unread'],
  ['account.support.reply', 'support_reponse'],
  ['account.support.type.service-complaint', 'support_complaint_category'],
  ['account.support.subtype.app', 'support_app_subcategory'],
  ['account.support.subtype.citizen-services', 'support_citizen_services_subcategory'],
  ['account.support.subtype.information', 'support_information_and_inquiries_subcategory'],
  ['account.support.subtype.regulations', 'support_disagreements_with_regulations_subcategory'],
  ['account.support.subtype.areas-hours', 'support_areas_zones_hours_subcategory'],
  ['account.support.subtype.surveillance', 'support_surveillance_system_subcategory'],
  ['account.support.status.closed', 'support_thread_closed'],
  ['account.vehicleAdd.plate', 'add_vehicle_plate_hint'],
  ['account.vehicleAdd.successTitle', 'add_vehicle_successful_update'],
  ['account.vehicleEdit.plate', 'edit_vehicle_plate_hint'],
  ['account.vehicleEdit.confirmDeleteMessage', 'vehicles_delete_dialog_message'],
  ['account.vehicleAdd.save', 'add_vehicle_save_button'],
  ['account.vehicleEdit.plate', 'edit_vehicle_plate_hint'],
  ['account.vehicleEdit.save', 'edit_vehicle_save_button'],
  ['account.notifications.parkingReceipt', 'notifications_parking'],
  ['account.notifications.successTitle', 'notifications_successful_update'],
  ['ops.detail.start', 'ticket_init_date'],
  ['common.accept', 'account_cancel_account_dialog_accept_button'],
  ['auth.newPassword.confirmation', 'reset_password_confirm_confirm_password_hint'],
  ['parking.zones', 'zones_title'],
  ['parking.map.municipioInfo', 'city_info_title'],
  ['parking.confirm.title', 'park_confirm_title'],
  ['parking.confirm.amount', 'operation_detail_amount'],
  ['parking.tickets.amount', 'operation_detail_amount'],
  ['parking.tickets.free', 'operation_detail_payment_method_free'],
]);

const dump = spawnSync(aaptPath, ['dump', 'resources', apkPath], {
  encoding: 'utf8',
  maxBuffer: 128 * 1024 * 1024,
});
if (dump.error) throw dump.error;
if (dump.status !== 0) throw new Error(dump.stderr || `aapt2 terminó con código ${dump.status}`);

function decodeAaptValue(rawValue) {
  const value = rawValue.trim();
  if (!value.startsWith('"')) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value
      .slice(1, value.endsWith('"') ? -1 : undefined)
      .replaceAll('\\"', '"')
      .replaceAll('\\n', '\n');
  }
}

function parseStrings(output) {
  const resources = new Map();
  let current = null;
  let pending = null;
  for (const line of output.split(/\r?\n/)) {
    const resource = line.match(/^\s+resource\s+0x[0-9a-f]+\s+string\/(.+)$/i);
    if (resource) {
      current = { name: resource[1], values: new Map() };
      resources.set(current.name, current);
      pending = null;
      continue;
    }
    if (!current) continue;
    const nextResource = line.match(/^\s+resource\s+/);
    if (nextResource) {
      current = null;
      pending = null;
      continue;
    }
    const configuredValue = line.match(/^\s+\(([^)]*)\)\s+(.*)$/);
    if (configuredValue) {
      const config = configuredValue[1] || 'default';
      const rawValue = configuredValue[2];
      if (rawValue.startsWith('"') && !/(?<!\\)"$/.test(rawValue)) {
        pending = { config, rawValue };
        continue;
      }
      const decoded = decodeAaptValue(rawValue);
      if (decoded !== null) current.values.set(config, decoded);
      pending = null;
      continue;
    }
    if (pending) {
      pending.rawValue += `\n${line.trim()}`;
      if (/(?<!\\)"$/.test(pending.rawValue)) {
        const decoded = decodeAaptValue(pending.rawValue);
        if (decoded !== null) current.values.set(pending.config, decoded);
        pending = null;
      }
    }
  }
  return resources;
}

function placeholders(value) {
  return [...value.matchAll(/{{\s*[^}]+\s*}}|%\d+\$[sdif]|%[sdif]/g)].map((match) => match[0]);
}

function normalize(value) {
  return value
    .normalize('NFKC')
    .replace(/{{\s*[^}]+\s*}}|%\d+\$[sdif]|%[sdif]/g, ' __ARG__ ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[“”«»]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('es');
}

function adaptPlaceholders(apkValue, referenceValue) {
  const referencePlaceholders = placeholders(referenceValue);
  let next = 0;
  return apkValue.replace(/%((\d+)\$)?[sdif]/g, (_match, _position, explicitPosition) => {
    const position = explicitPosition ? Number(explicitPosition) - 1 : next++;
    return referencePlaceholders[position] ?? referencePlaceholders[0] ?? _match;
  });
}

function isPlaceholder(language, value, spanish) {
  return value === `${language}_${spanish}`;
}

function tokenSet(value) {
  return new Set(
    value
      .toLocaleLowerCase('es')
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 2),
  );
}

function keyScore(key, resourceName) {
  const keyTokens = tokenSet(key.replaceAll('.', '_'));
  const resourceTokens = tokenSet(resourceName);
  let score = 0;
  for (const token of keyTokens) if (resourceTokens.has(token)) score += 1;
  return score;
}

function existingTranslationScore(resource, key, spanish) {
  return ['eu', 'fr', 'uk'].reduce((score, language) => {
    const current = catalogues[language][key];
    const apkValue = resource.values.get(apkLanguage[language]);
    if (!current || isPlaceholder(language, current, spanish) || !apkValue) return score;
    return score + (normalize(current) === normalize(apkValue) ? 10 : 0);
  }, 0);
}

const resources = parseStrings(dump.stdout);
const catalogues = Object.fromEntries(
  ['es', 'eu', 'fr', 'uk'].map((language) => [
    language,
    JSON.parse(readFileSync(path.join(catalogueDirectory, `${language}.json`), 'utf8')),
  ]),
);

const apkLanguage = { es: 'es', eu: 'eu', fr: 'fr', uk: 'default' };
const matches = [];
const unresolved = [];
const ambiguous = [];

for (const [key, spanish] of Object.entries(catalogues.es)) {
  if (typeof spanish !== 'string') continue;
  const override = resourceOverrides.get(key);
  let candidates =
    override && resources.has(override)
      ? [resources.get(override)]
      : [...resources.values()].filter((resource) => normalize(resource.values.get('es') || '') === normalize(spanish));
  let reason = 'spanish';

  if (override) reason = 'override';
  else if (!candidates.length) reason = 'web-only';

  const complete = candidates.filter((resource) =>
    Object.values(apkLanguage).every((language) => resource.values.has(language) && resource.values.get(language).trim()),
  );
  if (complete.length) candidates = complete;

  if (candidates.length > 1) {
    const ranked = candidates
      .map((resource) => ({
        resource,
        score: existingTranslationScore(resource, key, spanish) + keyScore(key, resource.name),
      }))
      .sort((left, right) => right.score - left.score || left.resource.name.localeCompare(right.resource.name));
    if (ranked[0].score > ranked[1].score) candidates = [ranked[0].resource];
    else {
      const signatures = new Set(
        candidates.map((resource) =>
          Object.values(apkLanguage)
            .map((language) => resource.values.get(language) || '')
            .join('\u0000'),
        ),
      );
      if (signatures.size === 1) candidates = [ranked[0].resource];
    }
  }

  if (candidates.length === 1) {
    const resource = candidates[0];
    const values = Object.fromEntries(
      Object.entries(apkLanguage).map(([language, apkConfig]) => [
        language,
        adaptPlaceholders(resource.values.get(apkConfig) || `${language}_${spanish}`, spanish),
      ]),
    );
    matches.push({ key, resource: resource.name, reason, values });
    continue;
  }

  const item = {
    key,
    spanish,
    candidates: candidates.map((resource) => ({
      resource: resource.name,
      values: Object.fromEntries(
        Object.entries(apkLanguage).map(([language, apkConfig]) => [language, resource.values.get(apkConfig) || null]),
      ),
    })),
  };
  if (candidates.length > 1) ambiguous.push(item);
  else unresolved.push(item);
}

if (shouldApply) {
  const matchedByKey = new Map(matches.map((match) => [match.key, match]));
  for (const language of ['es', 'eu', 'fr', 'uk']) {
    for (const [key, spanish] of Object.entries(catalogues.es)) {
      catalogues[language][key] =
        matchedByKey.get(key)?.values[language] ?? (language === 'es' ? spanish : `${language}_${spanish}`);
    }
    writeFileSync(path.join(catalogueDirectory, `${language}.json`), `${JSON.stringify(catalogues[language], null, 2)}\n`, 'utf8');
  }
}

const matchedByKey = new Map(matches.map((match) => [match.key, match]));
const mismatches = [];
if (shouldCheck) {
  for (const language of ['es', 'eu', 'fr', 'uk']) {
    for (const [key, spanish] of Object.entries(catalogues.es)) {
      const expected = matchedByKey.get(key)?.values[language] ?? (language === 'es' ? spanish : `${language}_${spanish}`);
      if (catalogues[language][key] !== expected) {
        mismatches.push({ language, key, expected, actual: catalogues[language][key] ?? null });
      }
    }
  }
}

const summary = {
  apk: apkPath,
  apkStringResources: resources.size,
  catalogueKeys: Object.keys(catalogues.es).length,
  matched: matches.length,
  unresolved: unresolved.length,
  ambiguous: ambiguous.length,
  mismatches: mismatches.length,
  applied: shouldApply,
};
console.log(JSON.stringify(summary, null, 2));
if (args.has('report')) {
  writeFileSync(
    path.resolve(String(args.get('report'))),
    `${JSON.stringify({ summary, matches, unresolved, ambiguous }, null, 2)}\n`,
    'utf8',
  );
}
if (shouldCheck && mismatches.length) {
  console.error(JSON.stringify(mismatches.slice(0, 50), null, 2));
  process.exitCode = 1;
}
