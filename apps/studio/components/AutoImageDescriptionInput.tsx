import { useEffect } from 'react';
import { set, useFormValue, type StringInputProps } from 'sanity';

const generatedDescription = ({ title, type, code }: { title?: string; type?: string; code?: string }) => {
  const subject = title || (type ? `${type} à venda` : 'Imóvel à venda');
  return `Foto de ${subject}${code ? ` — código ${code}` : ''}.`;
};

/** Fills new photo descriptions while preserving any wording an editor has entered. */
export function AutoImageDescriptionInput(props: StringInputProps) {
  const title = useFormValue(['title']) as string | undefined;
  const type = useFormValue(['type']) as string | undefined;
  const code = useFormValue(['code']) as string | undefined;
  const description = generatedDescription({ title, type, code });

  useEffect(() => {
    if (!props.value) props.onChange(set(description));
  }, [description, props]);

  return props.renderDefault(props);
}
