import { formatPrice } from './format';

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

const escape = (text: string) => text.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

/** Inline styles and table layout work in Outlook, Gmail and mobile mail clients. */
export function leadEmail(lead: Lead, property: LeadProperty, site: { name: string; url: string }) {
  const url = new URL(property.href, site.url).href;
  const details = `#${property.code} — ${property.title} — ${formatPrice(property.price)}`;
  const row = (label: string, content: string) => `<tr><td style="padding:14px 32px;font-size:16px;line-height:1.5"><strong>${label}</strong><br>${content}</td></tr>`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#17213c"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid #e0e3e9;border-radius:10px">
<tr><td style="padding:28px 32px;border-bottom:3px solid #ac0808;font-size:24px;font-weight:bold">${escape(site.name)}</td></tr>
<tr><td style="padding:28px 32px 12px"><h1 style="font-size:26px;margin:0 0 16px">Mais informações do Imóvel</h1><p style="color:#4b5563">Novo contato enviado pelo formulário do seu site.</p><p style="font-size:14px">${lead.email ? 'Responda a este e-mail para falar diretamente com o cliente.' : 'O cliente não informou e-mail. Entre em contato pelo telefone abaixo.'}</p></td></tr>
${row('Nome', escape(lead.name))}
${row('E-mail', lead.email ? `<a href="mailto:${escape(lead.email)}">${escape(lead.email)}</a>` : 'Não informado')}
${row('Telefone', `<a href="tel:${lead.phone.replace(/[^\d+]/g, '')}">${escape(lead.phone)}</a>`)}
${row('Imóvel', `${escape(details)}<br><a style="word-break:break-all" href="${escape(url)}">${escape(url)}</a>`)}
${row('Mensagem', escape(lead.message).replace(/\r?\n/g, '<br>'))}
<tr><td style="padding:28px 32px"><a href="${escape(url)}" style="display:block;text-align:center;background:#ac0808;border-radius:8px;padding:18px;color:#fff;text-decoration:none;font-weight:bold">VER IMÓVEL #${escape(property.code)}</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = `${site.name}\nMais informações do Imóvel #${property.code}\n\nNome: ${lead.name}\nE-mail: ${lead.email || 'Não informado'}\nTelefone: ${lead.phone}\n\nImóvel: ${details}\n${url}\n\nMensagem:\n${lead.message}`;
  return { subject: `Mais informações do Imóvel #${property.code}`, html, text };
}

export async function sendLeadEmail(input: {
  lead: Lead; property: LeadProperty; site: { name: string; url: string }; idempotencyKey: string;
}) {
  const key = process.env.RESEND_API_KEY;
  const domain = process.env.RESEND_EMAIL_DOMAIN;
  const from = process.env.LEAD_EMAIL_FROM || (domain ? `Alex Nolasco Imóveis <contato@${domain}>` : undefined);
  const to = process.env.LEAD_EMAIL_TO;
  if (!key || !from || !to) throw new Error('Lead email requires RESEND_API_KEY, a sender domain/address and LEAD_EMAIL_TO.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({ from, to: [to], ...(input.lead.email ? { reply_to: input.lead.email } : {}), ...leadEmail(input.lead, input.property, input.site) }),
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  });
  // Avoid logging the provider response, which may contain personal data.
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { name?: string };
    const kind = typeof error.name === 'string' && /^[a-z_]+$/.test(error.name) ? ` ${error.name}` : '';
    throw new Error(`Resend rejected lead notification (HTTP ${response.status}${kind}).`);
  }
  const result = await response.json() as { id?: string };
  if (!result.id) throw new Error('Resend did not confirm the lead notification.');
  return result.id;
}
