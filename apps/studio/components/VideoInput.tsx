import { useEffect, useState } from 'react';
import { set, useClient, type ObjectInputProps } from 'sanity';
import { captureVideoPoster } from '../lib/video-poster';

/** Retain Sanity's native uploader and generate its poster when a video is selected or replaced. */
export function VideoInput(props: ObjectInputProps) {
  const client = useClient({ apiVersion: '2025-02-19' });
  const { onChange, readOnly } = props;
  const value = props.value as { asset?: { _ref?: string }; poster?: { asset?: { _ref?: string } }; posterFor?: string } | undefined;
  const asset = value?.asset?._ref;
  const posterFor = value?.poster?.asset?._ref ? value.posterFor : undefined;
  const [status, setStatus] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!asset || readOnly || posterFor === asset) return;
    const controller = new AbortController();
    setStatus('Gerando capa a partir do vídeo…');
    const generate = async () => {
      const source = await client.getDocument<{ _id: string; url: string }>(asset);
      if (controller.signal.aborted) return;
      if (!source?.url) throw new Error('Vídeo ainda não disponível.');
      const blob = await captureVideoPoster(source.url, controller.signal);
      if (controller.signal.aborted) return;
      return client.assets.upload('image', blob, { filename: `${asset}-poster.jpg`, contentType: 'image/jpeg' });
    };
    void generate().then((poster) => {
      if (!controller.signal.aborted && poster) {
        onChange([
          set({ _type: 'image', asset: { _type: 'reference', _ref: poster._id } }, ['poster']),
          set(asset, ['posterFor']),
        ]);
        setStatus('');
      }
    }).catch(() => {
      if (!controller.signal.aborted) setStatus('Não foi possível gerar a capa.');
    });
    return () => controller.abort();
  }, [asset, posterFor, readOnly, onChange, client, attempt]);

  return <>{props.renderDefault(props)}{status ? <p role="status" style={{ fontSize: '0.875rem' }}>{status}{status.startsWith('Não') ? <> <button type="button" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button></> : null}</p> : null}</>;
}
