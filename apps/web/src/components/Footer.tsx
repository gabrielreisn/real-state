import { getSiteSettings, legacy, phoneLink, whatsappLink } from '@/content';

const links = [
  { label: 'A Empresa', href: legacy('/sobre') },
  { label: 'Mapa de Localização', href: legacy('/sobre#mapa') },
  { label: 'Cadastre seu Imóvel', href: legacy('/seu-imovel') },
  { label: 'Financiamento', href: legacy('/financiamento') },
  { label: 'Política de Diversidade', href: legacy('/pagina/politica-de-diversidade') },
];

export async function Footer() {
  const site = await getSiteSettings();
  return (
    <footer id="contato" className="bg-navy text-white [--focus:#fff]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.5fr_1fr_1fr] md:px-8">
        <div>
          <p className="text-2xl font-bold">{site.name}</p>
          <p className="mt-1 text-on-navy">
            {site.role}, Creci/ES {site.creci}
          </p>
          <a
            href={whatsappLink(site.whatsapp, 'Olá! Vim pelo site e gostaria de mais informações.')}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block bg-brand px-5 py-3 font-semibold hover:bg-brand-dark"
          >
            Conversar no WhatsApp
          </a>
        </div>
        <div>
          <h2 className="font-semibold">Contato</h2>
          <address className="mt-3 space-y-1 text-on-navy not-italic">
            <a href={phoneLink(site.whatsapp)} className="block tabular-nums hover:text-white hover:underline">
              {site.phone}
            </a>
            <a href={`mailto:${site.email}`} className="block break-all hover:text-white hover:underline">
              {site.email}
            </a>
            <p className="pt-2">
              {site.street}
              <br />
              {site.district}
            </p>
          </address>
        </div>
        <div>
          <h2 className="font-semibold">Informações</h2>
          <ul className="mt-3 space-y-1">
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-on-navy hover:text-white hover:underline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm text-on-navy md:px-8">
          © {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
