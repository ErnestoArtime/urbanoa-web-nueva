export type LegalContentType = 'help' | 'terms' | 'privacy';
export type LegalLanguage = 'es' | 'eu' | 'fr' | 'uk';

const LEGAL_PAGES: Record<LegalContentType, { folder: string; prefix: string }> = {
  help: { folder: 'OPSWebArinparkUrb', prefix: 'faq-arinpark' },
  terms: { folder: 'OPSPrepayWebArinpark', prefix: 'condiciones-de-uso' },
  privacy: { folder: 'OPSPrepayWebArinpark', prefix: 'politica-privacidad' },
};

export function legalContentPath(type: LegalContentType, language: LegalLanguage): string {
  const { folder, prefix } = LEGAL_PAGES[type];
  const code = language === 'uk' ? 'en' : language;
  return `/${folder}/${prefix}-${code}.html`;
}
