import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

// Credentials and bearer tokens stay in memory; evidence excludes personal data.
const base = process.env.OPS_VALIDATION_BASE ?? 'http://127.0.0.1:10213/ops-api/OPSWebServicesAPI';
const username = process.env.OPS_VALIDATION_USER;
const password = process.env.OPS_VALIDATION_PASSWORD;
if (!username || !password) throw new Error('Set OPS_VALIDATION_USER and OPS_VALIDATION_PASSWORD');
const cloudToken = randomUUID();
const evidence = [];
async function call(endpoint, body, token, os) {
  const response = await fetch(`${base}/${endpoint}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', cityId: '0', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(60000),
  });
  const data = await response.json();
  evidence.push({ endpoint, os, http: response.status, isSuccess: data.isSuccess, error: data.error,
    ...(endpoint === 'QueryUserAPI' ? { profile: { contractId: data.value?.contractId, operatingSystem: data.value?.operatingSystem } } : {}),
    ...(endpoint === 'QueryUserCreditAPI' ? { balanceCents: data.value } : {}),
    ...(endpoint === 'RefundUserCreditAPI' ? { simulate: body.simulate, amount: body.amount } : {}),
    ...(/^(Confirm|QueryParkingOperation|QueryUnParking)/.test(endpoint) ? { value: data.value, request: { ...body, ...(body?.cloudToken ? { cloudToken: '[present]' } : {}) } } : {}),
  });
  return data;
}
for (const os of process.env.OPS_VALIDATION_ALTERNATE_PLATE === '1' ? [3, 1] : [1, 3]) {
  const login = await call('LoginUserAPI', { userName: username, password, cloudToken, operatingSystem: os, appVersion: '4.0.0', language: 'es' }, undefined, os);
  const token = login.value?.token;
  if (!login.isSuccess || !token) continue;
  const profile = await call('QueryUserAPI', undefined, token, os);
  await call('QueryUserCreditAPI', undefined, token, os);
  const plates = await call('QueryUserPlatesAPI', undefined, token, os);
  const operations = await call('QueryUserOperationsAPI', { contractId: 0, dateStart: '000000010126', dateEnd: '235959311226', operationTypeList: [1, 2, 3, 4, 5, 7, 101, 102, 103, 104] }, token, os);
  if (process.env.OPS_VALIDATION_MUTATIONS === '1') {
    const now = () => {
      const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(p => [p.type, p.value]));
      return `${p.hour}${p.minute}${p.second}${p.day}${p.month}${p.year}`;
    };
    const sample = operations.value?.find(o => o.operationType === 1 && o.contractId === 1);
    if (sample) {
      if (process.env.OPS_VALIDATION_ALTERNATE_PLATE === '1') {
        const candidates = Array.isArray(plates.value) ? plates.value : plates.value?.platelist ?? [];
        const alternate = candidates.find(p => p.plate && p.plate !== sample.plate) ?? operations.value?.find(p => p.plate && p.plate !== sample.plate);
        if (alternate) sample.plate = alternate.plate;
      }
      const common = { contractId: sample.contractId, plate: sample.plate, sector: sample.sectorId, groupId: sample.sectorId, ticketId: sample.ticketId, ticket: sample.ticketId, datetime: now() };
      const quote = await call('QueryParkingOperationWithTimeStepsAPI', common, token, os);
      if (process.env.OPS_VALIDATION_CONFIRM === '1') {
        const step = quote.value?.steps?.[0];
        const body = { contractId: sample.contractId, plate: sample.plate, sector: sample.sectorId, quantity: step?.quantity ?? 40, tariffType: quote.value?.tariffType ?? sample.ticketId, cloudToken, operatingSystem: os, date: now(), time: step?.time ?? 30, latitude: sample.latitude || 0, longitude: sample.longitude || 0, reference: quote.value?.operationBase ? String(quote.value.operationBase) : '', spaceId: '', streetname: sample.pstreet || '', streetno: '', payMethodId: 0 };
        const parking = await call('ConfirmParkingOperationAPI', body, token, os);
        await call('QueryUserCreditAPI', undefined, token, os);
        if (parking.isSuccess && parking.value?.operationId) {
          const extensionQuote = await call('QueryParkingOperationWithTimeStepsAPI', { ...common, datetime: now() }, token, os);
          const extensionStep = extensionQuote.value?.steps?.[0];
          if (extensionQuote.isSuccess && extensionStep) await call('ConfirmParkingOperationAPI', { ...body, date: now(), quantity: extensionStep.quantity, time: extensionStep.time, reference: String(extensionQuote.value.operationBase || parking.value.operationId) }, token, os);
          await call('QueryUserCreditAPI', undefined, token, os);
          const verified = await call('QueryUserOperationsAPI', { contractId: 0, dateStart: '000000021026', dateEnd: '235959031026', operationTypeList: [1, 2, 3] }, token, os);
          evidence.push({ endpoint: 'Parking-verification', os, operationId: parking.value.operationId, found: verified.value?.some(o => String(o.operationNumber) === String(parking.value.operationId)) ?? false });
        }
        const unparkBody = { contractId: sample.contractId, plate: sample.plate, groupId: sample.sectorId, ticketId: sample.ticketId, datetime: now() };
        const unpark = await call('QueryUnParkingOperationAPI', unparkBody, token, os);
        await call('ConfirmUnParkingOperationAPI', { contractId: sample.contractId, plate: sample.plate, groupId: sample.sectorId, ticketId: sample.ticketId, quantity: unpark.value?.payAmount ?? 0, cloudToken, operatingSystem: os, date: now() }, token, os);
        await call('QueryUserCreditAPI', undefined, token, os);
      }
    }
    const fines = (operations.value ?? []).filter(o => o.operationType === 104);
    evidence.push({ endpoint: 'Fine-inventory', os, count: fines.length, statuses: [...new Set(fines.map(f => f.fineStatus))] });
    if (process.env.OPS_VALIDATION_CONFIRM === '1' && fines.length) {
      const fine = fines.find(f => f.fineStatus === 1) ?? fines[0];
      await call('ConfirmFinePaymentAPI', { contractId: fine.contractId, fine: fine.fineNumber, quantity: fine.paymentAmount || fine.fineAmount, date: now(), cloudToken: '', operatingSystem: os, payMethodId: 0 }, token, os);
      await call('QueryUserCreditAPI', undefined, token, os);
    }
    if (process.env.OPS_VALIDATION_CONFIRM === '1') await call('RefundUserCreditAPI', { contractId: 0, cloudToken, operatingSystem: os, amount: 100, simulate: 0 }, token, os);
  }
  if (profile.isSuccess && profile.value && process.env.OPS_VALIDATION_READ_ONLY !== '1') {
    const before = profile.value;
    await call('UpdateUserAPI', { ...before, userName: before.userName || username, operatingSystem: os, version: before.version || '4.0.0' }, token, os);
    const after = await call('QueryUserAPI', undefined, token, os);
    evidence.push({ endpoint: 'UpdateUserAPI-verification', os, verified: after.isSuccess === true, personalFieldsUnchanged: after.isSuccess ? ['names','firstSurname','secondSurname','email','nif','mainMobilePhone'].every(k => before[k] === after.value?.[k]) : null, contractIdBefore: before.contractId, contractIdAfter: after.value?.contractId });
  }
  if (process.env.OPS_VALIDATION_READ_ONLY !== '1') await call('RefundUserCreditAPI', { contractId: 0, cloudToken, operatingSystem: os, amount: 100, simulate: 1 }, token, os);
  await call('QueryUserCreditAPI', undefined, token, os);
}
const result = { timestamp: new Date().toISOString(), base, scope: process.env.OPS_VALIDATION_CONFIRM === '1' ? 'Test account: real parking, extension when parking succeeds, unparking, fine and refund confirmations; profile resubmitted unchanged.' : 'Login, authenticated reads, unchanged profile update and simulated refund.', evidence };
await writeFile(process.env.OPS_VALIDATION_OUTPUT ?? 'docs/auditoria-operating-system-2026-10-02/COMPARATIVA-OS-1-3.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
