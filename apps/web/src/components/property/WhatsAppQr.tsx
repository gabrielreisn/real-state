import QRCode from 'qrcode';
import { FaWhatsapp } from 'react-icons/fa6';

/** Render the QR as native SVG on the server, including the four-module white quiet zone. */
export function WhatsAppQr({ href, qrHref, code }: { href: string; qrHref: string; code: string }) {
  const { modules } = QRCode.create(qrHref, { errorCorrectionLevel: 'M' });
  const size = modules.size + 8;
  const cells: string[] = [];
  for (let row = 0; row < modules.size; row++) {
    for (let column = 0; column < modules.size; column++) {
      if (modules.get(row, column)) cells.push(`M${column + 4},${row + 4}h1v1h-1z`);
    }
  }

  return (
    <section aria-labelledby="whatsapp-qr-title" className="hidden border border-line bg-mist p-5 text-center lg:block">
      <h2 id="whatsapp-qr-title" className="flex items-center justify-center gap-2 text-lg font-bold">
        <FaWhatsapp aria-hidden className="text-xl" /> Converse pelo WhatsApp
      </h2>
      <p className="mt-2 text-sm text-slate">Aponte a câmera do celular para conversar sobre o imóvel {code}.</p>
      <a href={href} target="_blank" rel="noreferrer" className="mx-auto mt-4 block w-56 max-w-full rounded-lg bg-white p-1" aria-label={`Abrir WhatsApp sobre o imóvel ${code}`}>
        <svg role="img" aria-label={`QR code do WhatsApp para o imóvel ${code}`} viewBox={`0 0 ${size} ${size}`} width="224" height="224" className="h-auto w-full" shapeRendering="crispEdges">
          <rect width={size} height={size} fill="#fff" />
          <path d={cells.join('')} fill="#000" />
        </svg>
      </a>
      <a href={href} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-brand underline underline-offset-4">
        Abrir WhatsApp neste computador
      </a>
    </section>
  );
}
