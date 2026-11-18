import { legalContentPath } from './legal-content-path';

describe('legalContentPath', () => {
  it('builds the APK 4.0.1 paths for every language', () => {
    expect(legalContentPath('help', 'es')).toBe('/OPSWebArinparkUrb/faq-arinpark-es.html');
    expect(legalContentPath('terms', 'eu')).toBe('/OPSPrepayWebArinpark/condiciones-de-uso-eu.html');
    expect(legalContentPath('privacy', 'fr')).toBe('/OPSPrepayWebArinpark/politica-privacidad-fr.html');
    expect(legalContentPath('privacy', 'uk')).toBe('/OPSPrepayWebArinpark/politica-privacidad-en.html');
  });
});
