import { emailFrame, emailRow, escapeEmailText as escape, sendFormEmail } from './form-email';
import type { PropertySubmission } from './property-submission';

export function propertySubmissionEmail(submission: PropertySubmission, brand: string) {
  const contact = `${submission.propertyType} — ${submission.purpose} — ${submission.propertyCity}`;
  const subject = `Cadastro de imóvel: ${contact}`.replace(/[\r\n]/g, ' ');
  const phone = submission.phone.replace(/\D/g, '');
  const whatsapp = `https://wa.me/${phone.length <= 11 ? `55${phone}` : phone}`;
  const rows = [
    emailRow('Nome', escape(submission.name)),
    emailRow('Telefone', `<a href="tel:+${phone.length <= 11 ? `55${phone}` : phone}">${escape(submission.phone)}</a>`),
    emailRow('E-mail', submission.email ? `<a href="mailto:${escape(submission.email)}">${escape(submission.email)}</a>` : 'Não informado'),
    emailRow('Cidade / estado onde mora', escape(submission.residenceCity || 'Não informado')),
    emailRow('Tipo de imóvel', escape(submission.propertyType)),
    emailRow('Finalidade', escape(submission.purpose)),
    emailRow('Cidade / estado do imóvel', escape(submission.propertyCity)),
    emailRow('Descrição do imóvel', escape(submission.description).replace(/\r?\n/g, '<br>')),
  ].join('\n');
  const html = emailFrame({
    brand, heading: 'Novo cadastro de imóvel',
    introduction: `<p style="color:#4b5563">Recebido pelo formulário “Cadastre seu Imóvel” do site.</p><p style="font-size:14px">${submission.email ? 'Responda a este e-mail para falar diretamente com o interessado.' : 'O interessado não informou e-mail. Entre em contato pelo telefone abaixo.'}</p>`,
    rows, button: { label: 'CONVERSAR NO WHATSAPP', href: whatsapp },
  });
  const text = `${brand}\nNovo cadastro de imóvel\n\nNome: ${submission.name}\nTelefone: ${submission.phone}\nE-mail: ${submission.email || 'Não informado'}\nCidade / estado onde mora: ${submission.residenceCity || 'Não informado'}\n\nTipo de imóvel: ${submission.propertyType}\nFinalidade: ${submission.purpose}\nCidade / estado do imóvel: ${submission.propertyCity}\n\nDescrição do imóvel:\n${submission.description}\n\nWhatsApp: ${whatsapp}`;
  return { subject, html, text };
}

export function sendPropertySubmissionEmail(submission: PropertySubmission, brand: string, idempotencyKey: string) {
  return sendFormEmail(propertySubmissionEmail(submission, brand), { replyTo: submission.email, idempotencyKey });
}
