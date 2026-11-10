export type EmailContent = { subject: string; html: string; text: string };

export const escapeEmailText = (text: string) => text.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

export const emailRow = (label: string, content: string) => `<tr><td style="padding:14px 32px;font-size:16px;line-height:1.5"><strong>${label}</strong><br>${content}</td></tr>`;

export function emailFrame({ brand, heading, introduction, rows, button }: {
  brand: string; heading: string; introduction: string; rows: string;
  button: { label: string; href: string };
}) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#17213c"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid #e0e3e9;border-radius:10px">
<tr><td style="padding:28px 32px;border-bottom:3px solid #ac0808;font-size:24px;font-weight:bold">${escapeEmailText(brand)}</td></tr>
<tr><td style="padding:28px 32px 12px"><h1 style="font-size:26px;margin:0 0 16px">${escapeEmailText(heading)}</h1>${introduction}</td></tr>
${rows}
<tr><td style="padding:28px 32px"><a href="${escapeEmailText(button.href)}" style="display:block;text-align:center;background:#ac0808;border-radius:8px;padding:18px;color:#fff;text-decoration:none;font-weight:bold">${escapeEmailText(button.label)}</a></td></tr>
</table></td></tr></table></body></html>`;
}

/** Both website forms use the same sender, recipient, and provider confirmation rules. */
export async function sendFormEmail(content: EmailContent, { replyTo, idempotencyKey }: { replyTo?: string; idempotencyKey: string }) {
  const key = process.env.RESEND_API_KEY;
  const domain = process.env.RESEND_EMAIL_DOMAIN;
  const from = process.env.LEAD_EMAIL_FROM || (domain ? `Alex Nolasco Imóveis <contato@${domain}>` : undefined);
  const to = process.env.LEAD_EMAIL_TO;
  if (!key || !from || !to) throw new Error('Form email requires RESEND_API_KEY, a sender domain/address and LEAD_EMAIL_TO.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ from, to: [to], ...(replyTo ? { reply_to: replyTo } : {}), ...content }),
    signal: AbortSignal.timeout(10_000), cache: 'no-store',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { name?: string };
    const kind = typeof error.name === 'string' && /^[a-z_]+$/.test(error.name) ? ` ${error.name}` : '';
    throw new Error(`Resend rejected form notification (HTTP ${response.status}${kind}).`);
  }
  const result = await response.json() as { id?: string };
  if (!result.id) throw new Error('Resend did not confirm the form notification.');
  return result.id;
}
