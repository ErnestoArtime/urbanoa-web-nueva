import { signal } from '@angular/core';
import { apiErrorMessage } from './api-error-key';
import { OpsApiError } from '../api/ops-api.types';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';

describe('apiErrorMessage', () => {
  it('uses the exact OPS message for each active language, including uk as English', () => {
    const language = signal<'es' | 'eu' | 'fr' | 'uk'>('es');
    const translation = { currentLang$: language, translate: (key: string) => `translated:${key}` };
    const error = new OpsApiError('backend', OPS_ENDPOINTS.auth.recoverPassword, 'unused', undefined, {
      code: -20,
      type: 1,
      message_ES: 'Mensaje OPS',
      message_EU: 'OPS mezua',
      message_FR: 'Message OPS',
      message_EN: 'OPS message',
    });
    for (const [lang, expected] of [
      ['es', 'Mensaje OPS'],
      ['eu', 'OPS mezua'],
      ['fr', 'Message OPS'],
      ['uk', 'OPS message'],
    ] as const) {
      language.set(lang);
      expect(apiErrorMessage(error, translation)).toBe(expected);
    }
  });

  it('uses a translated fallback when the active language message is absent or empty', () => {
    const translation = { currentLang$: signal<'fr'>('fr'), translate: (key: string) => `translated:${key}` };
    for (const message_FR of [undefined, '', '  ']) {
      const error = new OpsApiError('backend', OPS_ENDPOINTS.auth.recoverPassword, 'unused', undefined, {
        code: -20,
        type: 1,
        message_ES: 'Otro idioma',
        message_FR,
      });
      expect(apiErrorMessage(error, translation, { unauthorized: 'auth.reset.unknownEmail' })).toBe('translated:auth.reset.unknownEmail');
    }
    expect(apiErrorMessage(new Error('internal detail'), translation)).toBe('translated:errors.server');
  });
});

describe('OPS message priority for every endpoint', () => {
  for (const endpoint of Object.values(OPS_ENDPOINTS).flatMap((group) => Object.values(group))) {
    it(`prioritizes all four backend translations for ${endpoint}`, () => {
      const language = signal<'es' | 'eu' | 'fr' | 'uk'>('es');
      const translation = { currentLang$: language, translate: (key: string) => `web:${key}` };
      const payload = {
        code: -9,
        type: 2,
        message_ES: 'Error genérico - 1025',
        message_EU: 'Errore generikoa - 1025',
        message_FR: 'Erreur générique - 1025',
        message_EN: 'Generic error - 1025',
      };
      for (const kind of ['backend', 'http'] as const) {
        const error = new OpsApiError(kind, endpoint, 'unused', kind === 'http' ? 500 : 200, payload);
        for (const [lang, message] of [
          ['es', payload.message_ES],
          ['eu', payload.message_EU],
          ['fr', payload.message_FR],
          ['uk', payload.message_EN],
        ] as const) {
          language.set(lang);
          expect(apiErrorMessage(error, translation, {}, 'payment.uncertain.message')).toBe(message);
        }
      }
      expect(apiErrorMessage(new Error('private detail'), translation, {}, 'errors.server')).toBe('web:errors.server');
    });
  }
});
