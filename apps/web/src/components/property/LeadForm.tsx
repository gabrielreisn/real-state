'use client';

import { useActionState } from 'react';
import { whatsappLink } from '@/content/site';
import { type LeadFormState, submitLead } from '@/app/imovel/actions';

const DEFAULT_MESSAGE =
  'Olá! Achei esse imóvel através do site www.alexnolasco.com.br. Por favor, gostaria de mais informações sobre o mesmo. Aguardo contato. Grato.';

const fieldClass = 'w-full border border-line bg-white px-3 py-2.5 placeholder:text-slate';

export function LeadForm({ propertyCode, whatsapp, id = 'lead' }: { propertyCode: string; whatsapp: string; id?: string }) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(submitLead, { status: 'idle' });

  if (state.status === 'success') {
    return (
      <p role="status" className="bg-white p-4 font-medium">
        Mensagem enviada! Em breve entraremos em contato.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="propertyCode" value={propertyCode} />
      {/* Honeypot: hidden from people, filled in by bots. */}
      <div className="absolute -left-[9999px]" aria-hidden>
        <label htmlFor={`${id}-website`}>Não preencha este campo</label>
        <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label htmlFor={`${id}-name`} className="sr-only">Nome</label>
        <input id={`${id}-name`} name="name" required maxLength={120} autoComplete="name" placeholder="Nome" className={fieldClass} />
      </div>
      <div>
        <label htmlFor={`${id}-email`} className="sr-only">E-mail (opcional)</label>
        <input id={`${id}-email`} name="email" type="email" maxLength={254} autoComplete="email" placeholder="E-mail (opcional)" className={fieldClass} />
      </div>
      <div>
        <label htmlFor={`${id}-phone`} className="sr-only">Telefone com DDD</label>
        <input id={`${id}-phone`} name="phone" type="tel" required minLength={10} maxLength={30} autoComplete="tel" placeholder="Telefone com DDD" className={fieldClass} />
      </div>
      <div>
        <label htmlFor={`${id}-message`} className="sr-only">Mensagem</label>
        <textarea id={`${id}-message`} name="message" required rows={5} maxLength={2000} defaultValue={DEFAULT_MESSAGE} className={fieldClass} />
      </div>
      {state.status === 'error' && (
        <p role="alert" className="text-sm font-medium text-brand">
          {state.message}{' '}
          <a href={whatsappLink(whatsapp, `Olá! Tenho interesse no imóvel código ${propertyCode}.`)} target="_blank" rel="noreferrer" className="underline">
            Fale conosco pelo WhatsApp.
          </a>
        </p>
      )}
      <button type="submit" disabled={pending} className="w-full bg-brand py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60">
        {pending ? 'Enviando…' : 'Enviar mensagem'}
      </button>
    </form>
  );
}
