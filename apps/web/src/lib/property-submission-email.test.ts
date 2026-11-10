import { describe, expect, it } from 'vitest';
import { propertySubmissionEmail } from './property-submission-email';

const submission = {
  name: 'Gabriel', phone: '(27) 99969-6096', email: 'gabriel@example.com', residenceCity: 'Vitória / ES',
  propertyType: 'Apartamento', purpose: 'Venda', propertyCity: 'Vila Velha / ES',
  description: '3 quartos, 132 m².\nValor pretendido: R$ 850.000.',
};

describe('owner submission email', () => {
  it('includes every submitted field in HTML and plain text', () => {
    const email = propertySubmissionEmail(submission, 'Alex Nolasco Imóveis');
    for (const value of Object.values(submission)) expect(email.text).toContain(value);
    expect(email.subject).toBe('Cadastro de imóvel: Apartamento — Venda — Vila Velha / ES');
    expect(email.html).toContain('https://wa.me/5527999696096');
    expect(email.html).toContain('132 m².<br>Valor pretendido');
  });
  it('escapes HTML and handles optional contact details', () => {
    const email = propertySubmissionEmail({ ...submission, name: '<script>bad</script>', email: undefined, residenceCity: undefined }, 'Alex Nolasco');
    expect(email.html).toContain('&lt;script&gt;bad&lt;/script&gt;');
    expect(email.html).not.toContain('<script>');
    expect(email.html).not.toContain('mailto:');
    expect(email.html).toContain('Não informado');
  });
});
