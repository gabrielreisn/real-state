import { useEffect } from 'react';
import { set, useFormValue, type ObjectInputProps } from 'sanity';

type PropertyImage = { asset?: { _ref?: string }; alt?: string; watermark?: boolean };

const generatedDescription = ({ title, type, code }: { title?: string; type?: string; code?: string }) => {
  const subject = title || (type ? `${type} à venda` : 'Imóvel à venda');
  return `Foto de ${subject}${code ? ` — código ${code}` : ''}.`;
};

/** Adds useful editorial defaults without changing the original image asset. */
export function PropertyImageInput(props: ObjectInputProps) {
  const value = props.value as PropertyImage | undefined;
  const title = useFormValue(['title']) as string | undefined;
  const type = useFormValue(['type']) as string | undefined;
  const code = useFormValue(['code']) as string | undefined;
  const alt = generatedDescription({ title, type, code });

  // Imported and newly uploaded photos both receive a meaningful description, while an editor's
  // own wording is never overwritten.
  useEffect(() => {
    if (value?.asset?._ref && !value.alt) props.onChange(set(alt, ['alt']));
  }, [alt, props, value?.alt, value?.asset?._ref]);

  return (
    <div>
      {props.renderDefault(props)}
      {value?.asset?._ref ? (
        <label style={{ display: 'block', marginTop: '0.75rem', padding: '0.75rem', border: '1px solid var(--card-border-color)', borderRadius: '0.25rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', fontWeight: 600 }}>
            Aplicar marca d’água
            <input
              type="checkbox"
              checked={Boolean(value.watermark)}
              onChange={(event) => props.onChange(set(event.currentTarget.checked, ['watermark']))}
              aria-label="Aplicar marca d’água nesta foto"
            />
          </span>
          <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--card-muted-fg-color)', fontSize: '0.875rem', fontWeight: 400 }}>
            A marca definida em Configurações do site aparece sobre esta foto no site, sem alterar o arquivo original.
          </span>
        </label>
      ) : null}
    </div>
  );
}
