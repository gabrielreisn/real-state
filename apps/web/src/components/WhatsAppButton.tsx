import { FaWhatsapp } from 'react-icons/fa6';
import { getSiteSettings, whatsappLink } from '@/content';

export async function WhatsAppButton() {
  const { whatsapp } = await getSiteSettings();
  return (
    <a
      href={whatsappLink(whatsapp, 'Olá! Vim pelo site www.alexnolasco.com.br e gostaria de mais informações.')}
      target="_blank"
      rel="noreferrer"
      aria-label="Conversar pelo WhatsApp"
      className="fixed right-4 bottom-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-3xl text-white shadow-lg md:hidden"
    >
      <FaWhatsapp aria-hidden />
    </a>
  );
}
