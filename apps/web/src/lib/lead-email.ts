import { formatPrice } from './format';
import { emailFrame, emailRow as row, escapeEmailText as escape, sendFormEmail } from './form-email';

export type Lead = { name: string; email?: string; phone: string; message: string; propertyCode: string };
export type LeadProperty = { code: string; title: string; href: string; price: number | null };

/** Untrusted values are validated here as well as by the browser form. */
export function validateLead(data: FormData): Lead | null {
  const text = (key: string) => typeof data.get(key) === 'string' ? (data.get(key) as string).trim() : '';
  const name = text('name');
  const email = text('email');
  const phone = text('phone');
  const message = text('message');
  const propertyCode = text('propertyCode');
  const digits = phone.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (!name || name.length > 120 || !message || message.length > 2000 ||
      !/^\+?[\d\s().-]{10,30}$/.test(phone) || !/^\d{10,11}$/.test(digits) ||
      email.length > 254 || (email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) ||
      !/^[a-zA-Z0-9-]{1,20}$/.test(propertyCode)) return null;
  return { name, email: email || undefined, phone, message, propertyCode };
}

/** Inline styles and table layout work in Outlook, Gmail and mobile mail clients. */
export function leadEmail(lead: Lead, property: LeadProperty, site: { name: string; url: string }) {
  const url = new URL(property.href, site.url).href;
  const details = `#${property.code} — ${property.title} — ${formatPrice(property.price)}`;
  const html = emailFrame({ brand: site.name, heading: 'Mais informações do Imóvel',
    introduction: `<p style="color:#4b5563">Novo contato enviado pelo formulário do seu site.</p><p style="font-size:14px">${lead.email ? 'Responda a este e-mail para falar diretamente com o cliente.' : 'O cliente não informou e-mail. Entre em contato pelo telefone abaixo.'}</p>`,
    rows: `${row('Nome', escape(lead.name))}
${row('E-mail', lead.email ? `<a href="mailto:${escape(lead.email)}">${escape(lead.email)}</a>` : 'Não informado')}
${row('Telefone', `<a href="tel:${lead.phone.replace(/[^\d+]/g, '')}">${escape(lead.phone)}</a>`)}
${row('Imóvel', `${escape(details)}<br><a style="word-break:break-all" href="${escape(url)}">${escape(url)}</a>`)}
${row('Mensagem', escape(lead.message).replace(/\r?\n/g, '<br>'))}`,
    button: { label: `VER IMÓVEL #${property.code}`, href: url },
  });
  const text = `${site.name}\nMais informações do Imóvel #${property.code}\n\nNome: ${lead.name}\nE-mail: ${lead.email || 'Não informado'}\nTelefone: ${lead.phone}\n\nImóvel: ${details}\n${url}\n\nMensagem:\n${lead.message}`;
  return { subject: `Mais informações do Imóvel #${property.code}`, html, text };
}

export function sendLeadEmail(input: {
  lead: Lead; property: LeadProperty; site: { name: string; url: string }; idempotencyKey: string;
}) {
  return sendFormEmail(leadEmail(input.lead, input.property, input.site), { replyTo: input.lead.email, idempotencyKey: input.idempotencyKey });
}
