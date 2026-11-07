'use client';

import { useState } from 'react';
import type { IconType } from 'react-icons';
import { FaCheck, FaEnvelope, FaFacebookF, FaLink, FaLinkedinIn, FaPinterestP, FaTelegram, FaWhatsapp, FaXTwitter } from 'react-icons/fa6';

export function ShareButtons({ url, title, imageUrl }: { url: string; title: string; imageUrl: string }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);

  const targets: { label: string; href: string; icon: IconType; color: string }[] = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${shareTitle}%20${shareUrl}`, icon: FaWhatsapp, color: 'bg-[#128c4a]' },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, icon: FaFacebookF, color: 'bg-[#1877f2]' },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, icon: FaLinkedinIn, color: 'bg-[#0a66c2]' },
    { label: 'Telegram', href: `https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`, icon: FaTelegram, color: 'bg-[#1c86c4]' },
    { label: 'X', href: `https://x.com/intent/post?url=${shareUrl}&text=${shareTitle}`, icon: FaXTwitter, color: 'bg-black' },
    { label: 'E-mail', href: `mailto:?subject=${shareTitle}&body=${shareUrl}`, icon: FaEnvelope, color: 'bg-[#1a73e8]' },
    {
      label: 'Pinterest',
      href: `https://pinterest.com/pin/create/button/?url=${shareUrl}&media=${encodeURIComponent(imageUrl)}&description=${shareTitle}`,
      icon: FaPinterestP,
      color: 'bg-[#bd081c]',
    },
  ];

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const buttonClass = 'flex h-10 w-10 items-center justify-center rounded text-lg text-white hover:opacity-85';

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Compartilhar">
      {targets.map(({ label, href, icon: Icon, color }) => (
        <li key={label}>
          <a href={href} target="_blank" rel="noreferrer" aria-label={`Compartilhar por ${label}`} className={`${buttonClass} ${color}`}>
            <Icon aria-hidden />
          </a>
        </li>
      ))}
      <li>
        <button type="button" onClick={copy} aria-label={copied ? 'Link copiado' : 'Copiar link'} className={`${buttonClass} bg-navy`}>
          {copied ? <FaCheck aria-hidden /> : <FaLink aria-hidden />}
        </button>
      </li>
    </ul>
  );
}
