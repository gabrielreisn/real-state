'use client';

import { useId, useState } from 'react';
import { estimateFinancing } from '@/lib/financing';

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function Field({ label, suffix, value, onChange }: { label: string; suffix?: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="mt-1 flex items-center rounded-lg border border-line bg-white pr-3 outline-offset-2 outline-brand has-[input:focus-visible]:border-navy has-[input:focus-visible]:outline-2">
        <input
          id={id}
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full min-w-0 rounded-lg bg-transparent px-3 py-2.5 focus-visible:outline-none"
        />
        {suffix ? <span className="shrink-0 text-sm text-slate">{suffix}</span> : null}
      </div>
    </div>
  );
}

function Result({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-sm text-on-navy">{label}</dt>
      <dd className="mt-0.5 text-2xl font-bold">{value}</dd>
      {note ? <dd className="text-sm text-on-navy">{note}</dd> : null}
    </div>
  );
}

/** A rough first-installment estimate, so buyers know what to expect before opening a bank's simulator. */
export function FinancingCalculator() {
  const [price, setPrice] = useState('800000');
  const [downPayment, setDownPayment] = useState('160000');
  const [years, setYears] = useState('30');
  const [annualRate, setAnnualRate] = useState('12');
  const estimate = estimateFinancing({ price: Number(price), downPayment: Number(downPayment), years: Number(years), annualRate: Number(annualRate) });

  return (
    <section aria-labelledby="simulacao-titulo" className="mt-10 overflow-hidden rounded-lg border border-line text-base">
      <div className="p-5 md:p-6">
        <h2 id="simulacao-titulo" className="text-2xl font-bold">
          Estime sua parcela
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Valor do imóvel" suffix="R$" value={price} onChange={setPrice} />
          <Field label="Entrada" suffix="R$" value={downPayment} onChange={setDownPayment} />
          <Field label="Prazo" suffix="anos" value={years} onChange={setYears} />
          <Field label="Taxa de juros" suffix="% a.a." value={annualRate} onChange={setAnnualRate} />
        </div>
      </div>
      <div aria-live="polite" className="bg-navy p-5 text-white md:p-6">
        {estimate ? (
          <dl className="grid gap-5 sm:grid-cols-2">
            <Result label="Primeira parcela (SAC)" value={money(estimate.sacFirst)} note={`Última: ${money(estimate.sacLast)}`} />
            <Result label="Parcela fixa (Price)" value={money(estimate.price)} note={`${estimate.months} meses`} />
            <Result label="Renda sugerida (SAC)" value={money(estimate.incomeForSac)} note="Parcela em até 30% da renda" />
            <Result label="ITBI estimado (2%)" value={money(estimate.itbi)} note={`Valor financiado: ${money(estimate.financed)}`} />
          </dl>
        ) : (
          <p>Confira os valores: a entrada precisa ser menor que o valor do imóvel.</p>
        )}
      </div>
      <p className="p-5 text-sm text-slate md:px-6">
        Estimativa sem TR, seguros obrigatórios e tarifas. O valor real depende da análise de crédito de cada banco.
      </p>
    </section>
  );
}
