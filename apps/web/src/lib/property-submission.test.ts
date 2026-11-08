import { describe, expect, it } from 'vitest';
import { validatePropertySubmission } from './property-submission';

const valid = {
  name: ' João ',
  phone: '(27) 98888-7777',
  propertyType: 'Apartamento',
  purpose: 'Venda',
  propertyCity: 'Vitória / ES',
  description: '3 quartos em Jardim Camburi',
};

describe('validatePropertySubmission', () => {
  it('accepts a valid submission, trimming text and dropping empty optional fields', () => {
    expect(validatePropertySubmission({ ...valid, email: '  ', residenceCity: '' })).toEqual({
      ok: true,
      value: { ...valid, name: 'João', email: undefined, residenceCity: undefined },
    });
  });

  it.each([
    ['name', { ...valid, name: '   ' }],
    ['phone', { ...valid, phone: '123' }],
    ['email', { ...valid, email: 'joao@' }],
    ['propertyType', { ...valid, propertyType: 'Castelo' }],
    ['purpose', { ...valid, purpose: 'Permuta' }],
    ['propertyCity', { ...valid, propertyCity: undefined }],
    ['description', { ...valid, description: 'x'.repeat(4001) }],
  ])('rejects an invalid %s', (field, input) => {
    expect(validatePropertySubmission(input)).toEqual({ ok: false, fields: [field] });
  });

  it('ignores values that are not strings', () => {
    expect(validatePropertySubmission({ ...valid, name: { $ne: '' } })).toEqual({ ok: false, fields: ['name'] });
  });
});
