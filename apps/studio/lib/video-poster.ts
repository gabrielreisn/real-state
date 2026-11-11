/** Capture an actual decoded frame without playing audio or uploading a separate source file. */
export async function captureVideoPoster(url: string, signal: AbortSignal): Promise<Blob> {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  const waitFor = (event: string) => new Promise<void>((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); video.removeEventListener(event, success); video.removeEventListener('error', failure); signal.removeEventListener('abort', abort); };
    const success = () => { cleanup(); resolve(); };
    const failure = () => { cleanup(); reject(new Error('Não foi possível abrir o vídeo para gerar a capa.')); };
    const abort = () => { cleanup(); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(failure, 30_000);
    video.addEventListener(event, success, { once: true });
    video.addEventListener('error', failure, { once: true });
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });

  try {
    const metadata = waitFor('loadedmetadata');
    video.src = url;
    video.load();
    await metadata;
    if (!video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration)) throw new Error('Formato de vídeo não suportado pelo navegador.');
    const frame = waitFor('seeked');
    video.currentTime = Math.min(1, video.duration / 2);
    await frame;
    const scale = Math.min(1, 1280 / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível gerar a capa do vídeo.');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Não foi possível salvar a capa do vídeo.')), 'image/jpeg', 0.85));
  } finally {
    video.removeAttribute('src');
    video.load();
  }
}
