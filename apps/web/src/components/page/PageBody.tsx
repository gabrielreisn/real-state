import { PortableText, type PortableTextComponents } from '@portabletext/react';
import { FaArrowUpRightFromSquare } from 'react-icons/fa6';

type LinkCards = { links?: { _key: string; label: string; description?: string; url: string }[] };
type MapEmbed = { title?: string; address: string };

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mt-4 first:mt-0">{children}</p>,
    h2: ({ children }) => <h2 className="mt-10 text-2xl font-bold first:mt-0">{children}</h2>,
  },
  list: {
    bullet: ({ children }) => <ul className="mt-4 list-disc space-y-1 pl-5">{children}</ul>,
    number: ({ children }) => <ol className="mt-4 list-decimal space-y-1 pl-5">{children}</ol>,
  },
  marks: {
    link: ({ children, value }) => (
      <a href={value?.href} className="font-medium text-brand underline underline-offset-2">
        {children}
      </a>
    ),
  },
  types: {
    linkCards: ({ value }: { value: LinkCards }) => (
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {(value.links ?? []).map((link) => (
          <li key={link._key}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex h-full items-center justify-between gap-4 border border-line p-4 hover:border-navy"
            >
              <span>
                <span className="block font-semibold">{link.label}</span>
                {link.description ? <span className="block text-sm text-slate">{link.description}</span> : null}
              </span>
              <FaArrowUpRightFromSquare aria-hidden className="shrink-0 text-sm text-slate" />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          </li>
        ))}
      </ul>
    ),
    // A keyless Google Maps embed of the address.
    mapEmbed: ({ value }: { value: MapEmbed }) => (
      <figure id="mapa" className="mt-10 scroll-mt-6">
        <figcaption className="mb-3 text-xl font-bold">{value.title ?? 'Localização'}</figcaption>
        <iframe
          title={`Mapa: ${value.address}`}
          src={`https://www.google.com/maps?q=${encodeURIComponent(value.address)}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="aspect-[16/10] w-full border-0 bg-mist"
        />
        <p className="mt-2 text-sm text-slate">{value.address}</p>
      </figure>
    ),
  },
};

export function PageBody({ value }: { value: unknown[] }) {
  return (
    <div className="max-w-prose text-lg leading-relaxed">
      <PortableText value={value as Parameters<typeof PortableText>[0]['value']} components={components} />
    </div>
  );
}
