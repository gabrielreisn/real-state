'use client';

import { type ReactNode, useActionState, useId } from 'react';
import { type SubmissionState, submitProperty } from '@/app/[page]/actions';
import { Select } from '@/components/ui/Select';
import { whatsappLink } from '@/content/site';
import { PROPERTY_TYPES, PURPOSES } from '@/lib/property-submission';

const inputClass = 'w-full border border-line bg-white px-3 py-2.5 placeholder:text-slate';
const selectClass = `${inputClass} flex items-center justify-between gap-3 text-left`;
const toOptions = (values: readonly string[]) => [{ options: values.map((value) => ({ value, label: value })) }];

function Field({ label, optional, children }: { label: string; optional?: boolean; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {optional ? <span className="font-normal text-slate"> (opcional)</span> : null}
      </label>
      {children(id)}
    </div>
  );
}

export function PropertySubmissionForm({ whatsapp }: { whatsapp: string }) {
  const [state, action, pending] = useActionState<SubmissionState, FormData>(submitProperty, { status: 'idle' });

  const values = state.status === 'error' ? state.values : {};

  if (state.status === 'success') {
    return (
      <p role="status" className="bg-white p-4 font-medium">
        Cadastro enviado! Vamos analisar o seu imóvel e entrar em contato em breve.
      </p>
    );
  }

  return (
    // A new key per failed attempt remounts the fields with the submitted values: React's
    // automatic form reset restores text inputs from defaultValue but not selects.
    <form key={state.status === 'error' ? state.attempt : 'initial'} action={action} className="space-y-4">
      {/* Honeypot: hidden from people, filled in by bots. */}
      <div className="absolute -left-[9999px]" aria-hidden>
        <label>
          Não preencha este campo
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Field label="Nome">{(id) => <input id={id} name="name" required maxLength={120} autoComplete="name" defaultValue={values.name} className={inputClass} />}</Field>
      <Field label="Telefone com DDD">
        {(id) => (
          <input
            id={id}
            name="phone"
            type="tel"
            required
            minLength={10}
            maxLength={30}
            autoComplete="tel"
            defaultValue={values.phone}
            className={inputClass}
          />
        )}
      </Field>
      <Field label="E-mail" optional>
        {(id) => <input id={id} name="email" type="email" maxLength={254} autoComplete="email" defaultValue={values.email} className={inputClass} />}
      </Field>
      <Field label="Cidade / estado onde você mora" optional>
        {(id) => <input id={id} name="residenceCity" maxLength={120} defaultValue={values.residenceCity} className={inputClass} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field label="Tipo de imóvel">
          {(id) => (
            <Select id={id} name="propertyType" required groups={toOptions(PROPERTY_TYPES)} defaultValue={values.propertyType ?? ''} placeholder="Selecione" className={selectClass} />
          )}
        </Field>
        <Field label="Finalidade">
          {(id) => (
            <Select id={id} name="purpose" required groups={toOptions(PURPOSES)} defaultValue={values.purpose ?? 'Venda'} className={selectClass} />
          )}
        </Field>
      </div>
      <Field label="Cidade / estado do imóvel">
        {(id) => <input id={id} name="propertyCity" required maxLength={120} defaultValue={values.propertyCity} className={inputClass} />}
      </Field>
      <Field label="Descrição do imóvel">
        {(id) => (
          <textarea
            id={id}
            name="description"
            required
            rows={5}
            maxLength={4000}
            defaultValue={values.description}
            placeholder="Quartos, área, localização, valor pretendido…"
            className={inputClass}
          />
        )}
      </Field>
      {state.status === 'error' ? (
        <p role="alert" className="text-sm font-medium text-brand">
          {state.message}{' '}
          <a href={whatsappLink(whatsapp, 'Olá! Gostaria de cadastrar meu imóvel.')} target="_blank" rel="noreferrer" className="underline">
            Envie pelo WhatsApp.
          </a>
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
        {pending ? 'Enviando…' : 'Enviar cadastro'}
      </button>
    </form>
  );
}
