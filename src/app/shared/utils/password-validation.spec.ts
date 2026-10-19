import { isValidApkPassword } from './password-validation';
describe('APK password rules', () => {
  for (const [password, valid] of [
    ['abc12', false],
    ['abc123', true],
    ['abcdef', false],
    ['abcdefgh', false],
    ['123456', true],
    ['áéíóú1', true],
  ] as const) {
    it(`validates ${password.length} characters with a digit: ${valid}`, () => expect(isValidApkPassword(password)).toBe(valid));
  }
});
