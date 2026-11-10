/** Generate realistic, non-sending previews: pnpm dlx tsx apps/web/scripts/preview-emails.ts <output-directory> */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { leadEmail } from '../src/lib/lead-email';
import { propertySubmissionEmail } from '../src/lib/property-submission-email';

const output = process.argv[2];
if (!output) throw new Error('Pass an output directory.');
mkdirSync(output, { recursive: true });
const brand = 'Alex Nolasco Imóveis';
const contact = { name: 'Gabriel (exemplo)', email: 'cliente@example.com', phone: '(27) 99999-0000' };
const emails = {
  'interesse-no-imovel': leadEmail({ ...contact, propertyCode: '1168', message: 'Olá! Gostaria de mais informações sobre este apartamento e de agendar uma visita.' },
    { code: '1168', title: 'Apartamento em Itapuã, Vila Velha / ES', price: 850000, href: '/imovel/1168/apartamento-venda-vila-velha-es-itapua-ed-liverpool' },
    { name: brand, url: 'https://real-state-one-smoky.vercel.app' }),
  'cadastro-de-imovel': propertySubmissionEmail({ ...contact, residenceCity: 'Vitória / ES', propertyType: 'Apartamento', purpose: 'Venda', propertyCity: 'Vila Velha / ES', description: 'Apartamento com 3 quartos (1 suíte), 132 m² e 2 vagas.\nLocalização: Itapuã, Vila Velha.\nValor pretendido: R$ 850.000,00.\nGostaria de uma avaliação e ajuda com a venda.' }, brand),
};
for (const [name, email] of Object.entries(emails)) {
  writeFileSync(path.join(output, `${name}.html`), email.html);
  console.log(`${email.subject}: ${path.join(output, `${name}.html`)}`);
}
