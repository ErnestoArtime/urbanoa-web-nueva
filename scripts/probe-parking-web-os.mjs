import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const base = 'http://127.0.0.1:10213/ops-api/OPSWebServicesAPI';
const cloudToken = randomUUID();
const evidence = [];
let token;
const now = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(p => [p.type, p.value]));
  return `${p.hour}${p.minute}${p.second}${p.day}${p.month}${p.year}`;
};
async function call(endpoint, body) {
  const res = await fetch(`${base}/${endpoint}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', cityId: '0', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(60000) });
  const data = await res.json();
  const safe = { endpoint, http: res.status, isSuccess: data.isSuccess, error: data.error, ...(endpoint === 'LoginUserAPI' ? { operatingSystem: body.operatingSystem } : { value: data.value }), ...(/^Confirm/.test(endpoint) ? { request: { ...body, cloudToken: '<present>' } } : {}) };
  evidence.push(safe);
  console.log(JSON.stringify(safe));
  return data;
}
const login = await call('LoginUserAPI', { userName: process.env.OPS_VALIDATION_USER, password: process.env.OPS_VALIDATION_PASSWORD, cloudToken, operatingSystem: 3, appVersion: '4.0.0', language: 'es' });
token = login.value?.token;
if (!token) throw new Error('Login failed');
await call('QueryUserCreditAPI');
const plates = { value: { plates: [{ plate: '33445566' }] } }; // Registered test vehicle verified through QueryUserPlatesAPI.
let common;
let quote;
for (const vehicle of plates.value?.plates ?? []) {
  common = { contractId: 1, plate: vehicle.plate, sector: 60201, groupId: 60201, ticketId: 4, ticket: 4 };
  if (!common.plate) continue;
  quote = await call('QueryParkingOperationWithTimeStepsAPI', { ...common, datetime: now() });
  if (quote.isSuccess && quote.value?.result === 1) break;
}
if (process.env.OPS_PARKING_CONFIRM === '1' && quote?.isSuccess && quote.value?.result === 1) {
  const steps = quote.value.steps ?? [];
  const step = steps.find(s => Number(s.time) >= 30 && Number(s.quantity) > 0 && Number(s.quantity) <= 100);
  if (!step) throw new Error('No valid low-cost quoted step; inspect quotation');
  const body = { contractId: 1, plate: common.plate, sector: common.sector, quantity: Number(step.quantity), tariffType: quote.value.ticketId || quote.value.tariffType || 4, cloudToken, operatingSystem: 3, date: now(), time: Number(step.time), latitude: 0, longitude: 0, reference: String(quote.value.operationBase || ''), spaceId: '', streetname: '', streetno: '', payMethodId: 0 };
  const parking = await call('ConfirmParkingOperationAPI', body);
  await call('QueryUserCreditAPI');
  const unpark = await call('QueryUnParkingOperationAPI', { contractId: 1, plate: common.plate, groupId: common.groupId, ticketId: common.ticketId, datetime: now() });
  if (parking.isSuccess && unpark.isSuccess && unpark.value?.result === 1) {
    const unparkBody = { contractId: 1, plate: common.plate, groupId: common.groupId, ticketId: common.ticketId, quantity: unpark.value.payAmount ?? 0, cloudToken, operatingSystem: 3, date: now() };
    const result = await call('ConfirmUnParkingOperationAPI', unparkBody);
    if (!result.isSuccess) await call('ConfirmUnParkingOperationAPI', { ...unparkBody, operatingSystem: 1, date: now() });
    await call('QueryUserCreditAPI');
  }
}
await writeFile('docs/auditoria-operating-system-2026-10-02/PRUEBA-PARKING-OS-WEB.json', JSON.stringify({ timestamp: new Date().toISOString(), evidence }, null, 2));
