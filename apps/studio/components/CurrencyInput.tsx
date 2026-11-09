import { useEffect, useState } from 'react';
import { TextInput } from '@sanity/ui';
import { set, type NumberInputProps, unset } from 'sanity';

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const display = (value: number | undefined) => (value === undefined ? '' : formatter.format(value));

function parseCurrency(input: string) {
  const cleaned = input.replace(/R\$|\s/g, '');
  if (!cleaned) return undefined;

  const comma = cleaned.lastIndexOf(',');
  const dot = cleaned.lastIndexOf('.');
  const normalized = comma > dot ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '');
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

/** A human-friendly BRL field that continues to persist a plain number in Sanity. */
export function CurrencyInput({ value, onChange, elementProps, readOnly }: NumberInputProps) {
  const numeric = typeof value === 'number' ? value : undefined;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(display(numeric));

  useEffect(() => {
    if (!editing) setText(display(numeric));
  }, [editing, numeric]);

  return (
    <TextInput
      {...elementProps}
      inputMode="decimal"
      readOnly={readOnly}
      value={text}
      onFocus={(event) => {
        setEditing(true);
        setText(numeric === undefined ? '' : String(numeric));
        elementProps.onFocus?.(event);
      }}
      onChange={(event) => setText(event.currentTarget.value)}
      onBlur={(event) => {
        const next = parseCurrency(text);
        onChange(next === undefined ? unset() : set(next));
        setEditing(false);
        elementProps.onBlur?.(event);
      }}
    />
  );
}
