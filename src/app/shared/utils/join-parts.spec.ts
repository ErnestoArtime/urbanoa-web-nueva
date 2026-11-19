import { joinParts } from './join-parts';

describe('joinParts', () => {
  it('skips empty parts', () => {
    expect(joinParts(['', 'Donostia', undefined, 'Tique'])).toBe('Donostia · Tique');
    expect(joinParts(['Zona', ' '])).toBe('Zona');
  });
});
