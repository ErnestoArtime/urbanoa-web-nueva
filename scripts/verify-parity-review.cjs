// Run with: playwright-cli -s=parity-review run-code --filename scripts/verify-parity-review.cjs
// All business responses are synthetic. No requests reach the real OPS server.
async (page) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const fixtures = [
    { operationNumber: 42, operationType: 1, contractId: 1, contractName: 'Municipio de prueba', plate: '0000TEST', opDate: '120000140926', parkingStartDate: '233000150926', parkingEndDate: '013000160926', parkingDuration: 120, paymentAmount: 200, sectorDesc: 'Sector de prueba', sectorColor: '#008800' },
    { operationNumber: 489, operationType: 5, contractId: 1, opDate: '185100310826', paymentAmount: 2000, newBalance: 25215 },
    { operationNumber: 490, operationType: 7, contractId: 1, opDate: '185100310826', paymentAmount: 0 },
  ];
  await page.route('**/*', async route => {
    const address = route.request().url();
    const url = { pathname: address.replace(/^https?:\/\/[^/]+/, '').split('?')[0] };
    if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(address)) return route.abort();
    if (!url.pathname.includes('ops-api') && !url.pathname.includes('OPSWebServicesAPI')) return route.continue();
    let value = [];
    if (url.pathname.includes('QueryUserOperations')) value = fixtures;
    else if (url.pathname.includes('QueryUserCredit')) value = 25215;
    else if (url.pathname.includes('QueryUserPaymentMethods')) value = { payMethods: [] };
    else if (url.pathname.includes('QueryUserFeedback')) value = { feedback: [{ id: 12, contractId: 1, date: '120000260826', type: 1, subtype: 1, message: 'Consulta de prueba', status: 1, read: 1 }, { id: 14, baseId: 12, contractId: 1, date: '130000260826', type: 1, subtype: 1, message: 'Respuesta de prueba', status: 1, read: 1, files: [{ filename: 'respuesta.pdf', direction: 1, payload: 'JVBERi0xLjQ=' }] }] };
    else if (url.pathname.endsWith('/QueryUserAPI')) value = { name: 'Usuario', surname: 'de prueba', email: 'test@example.invalid', address: {} };
    else if (url.pathname.includes('UpdateUserNotifications')) return route.fulfill({ json: { isSuccess: false, value: null, error: { code: -9, message: 'Synthetic failure' } } });
    return route.fulfill({ json: { isSuccess: true, value, error: null } });
  });
  await page.addInitScript(() => {
    localStorage.setItem('urbanoa-lang', 'es');
    localStorage.setItem('urbanoa.auth.session', JSON.stringify({ token: 'parity-fixture-only', refreshToken: '', user: { id: 'fixture', name: 'Usuario', surname: 'de prueba', email: 'test@example.invalid', address: {} } }));
  });
  const checks = [];
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (const [name, path] of [
      ['parking', '/app/parking/success?operationId=42&cityId=1&mode=parking'],
      ['parking-missing', '/app/parking/success?operationId=999&mode=parking'],
      ['topup', '/app/operations/detail/489'],
      ['refund-detail', '/app/operations/detail/490'],
      ['report-expired', '/app/operations/report-success'],
      ['support', '/app/account/support/12'],
      ['refund', '/app/account/refund'],
      ['notifications', '/onboarding/notification'],
    ]) {
      await page.goto('http://localhost:4200' + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.locator('h1:visible, h2:visible, app-onboarding-notification button:visible').first().waitFor({ timeout: 10000 });
      await page.waitForTimeout(350);
      const body = await page.locator('body').innerText();
      if (name === 'parking' && !body.includes('0000TEST')) throw new Error('Authoritative receipt missing');
      if (name === 'parking-missing' && !body.includes('No podemos mostrar un justificante confirmado')) throw new Error('Missing receipt state missing');
      if (name === 'topup' && !body.includes('Recarga de monedero')) throw new Error('Top-up detail missing');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      checks.push({ name, width: viewport.width, url: page.url(), overflow, body });
      await page.screenshot({ path: `output/playwright/parity-review-${name}-${viewport.width}.png`, fullPage: true, timeout: 10000 });
    }
  }
  return { checks, errors };
}
