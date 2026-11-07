/**
 * Turns one listing page from the current ImobiBrasil site into structured data.
 * Pure function: no network, so it can be tested against cached pages.
 */
import { type CheerioAPI, load } from 'cheerio';

export type ParsedListing = {
  legacyId: string;
  slug: string;
  url: string;
  code: string;
  type: string;
  purpose: string;
  city: string;
  state: string;
  neighborhood: string;
  title: string;
  summary: string;
  price: number | null;
  address?: string;
  condominium?: string;
  inCondominium?: boolean;
  condoFee?: number;
  iptu?: number;
  area?: number;
  builtArea?: number;
  landArea?: number;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  parking?: number;
  livingRooms?: number;
  description: string;
  featureGroups: { title: string; items: string[] }[];
  images: string[];
};

const CDN = 'https://imgs2.cdn-imobibrasil.com.br';

/** Most pages are Windows-1252; fall back to it whenever the bytes are not valid UTF-8. */
export function decodePage(bytes: Uint8Array) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

/** "1.400,00" → 1400, "120 m²" → 120. Zero means "not filled in" on this site. */
function number(text: string | undefined) {
  const match = text?.match(/\d[\d.]*(?:,\d+)?/);
  if (!match) return undefined;
  const value = Number(match[0].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function textWithLineBreaks($: CheerioAPI, element: ReturnType<CheerioAPI>) {
  const copy = element.clone();
  copy.find('br').replaceWith('\n');
  copy.find('p, div, li, h1, h2, h3, h4').each((_, node) => {
    $(node).append('\n');
  });
  return copy
    .text()
    .split('\n')
    .map((line) => clean(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseListing(bytes: Uint8Array, url: string): ParsedListing {
  const $ = load(decodePage(bytes));
  $('style, script, noscript').remove();

  const [, legacyId, slug] = url.match(/\/imovel\/(\d+)\/([^/?#]+)/) ?? [];
  if (!legacyId) throw new Error(`Not a listing URL: ${url}`);

  // "<Type> para <Venda>, <City> / <UF>, bairro <Neighborhood>, <summary…>". A few listings were
  // saved without a city, so that part is optional; the importer infers it from the neighborhood.
  const pageTitle = clean($('title').text());
  const heading = pageTitle.match(/^(.+?) para (Venda|Loca\S+)(?:, ([^,]+?) \/ ([A-Z]{2}))?(?:, (.*))?$/);
  if (!heading) throw new Error(`Unrecognized title "${pageTitle}" on ${url}`);
  const [, type, purpose, city = '', state = 'ES', rest = ''] = heading;

  // Labelled facts live in table cells: "Código: 807", "Área Útil: 120 m²", …
  const facts = new Map<string, string>();
  $('td').each((_, cell) => {
    const match = clean($(cell).text()).match(/^([^:]{2,30}):\s*(.*)$/);
    if (match && !facts.has(match[1])) facts.set(match[1], match[2].replace(/›$/, '').trim());
  });
  const fact = (...labels: string[]) => labels.map((label) => facts.get(label)).find((value) => value);

  // The bar under the title: price first, then quick stats such as "Área Privativa 120,00".
  const bar = clean($('.conteudo-barra-valor').first().text());
  const priceMatch = bar.match(/R\$\s*([\d.]+,\d{2})/);
  const privateArea = number(bar.match(/[ÁA]rea Privativa\s*([\d.,]+)/)?.[1]);

  // "Condomínio" holds either the monthly fee ("R$ 499,00") or the building's name ("iU-05").
  const condominiumFact = fact('Condomínio');
  const condoIsFee = condominiumFact ? /^R\$/.test(condominiumFact) : false;

  const neighborhood = fact('Bairro') ?? rest.match(/^bairro ([^,]+)/)?.[1]?.trim() ?? '';
  const code = fact('Código');
  if (!code) throw new Error(`No listing code on ${url}`);

  // Several elements carry the "descricao" class (the breadcrumb is one); the description is the
  // block whose heading reads "Descrição do Imóvel".
  const descriptionHeading = $('h3.titulo-int')
    .filter((_, node) => /^Descri..o do Im.vel$/.test(clean($(node).text())))
    .first();
  const description = descriptionHeading.parent().clone();
  description.find('h3.titulo-int, .imovel_cx_caracteristicas').remove();

  const featureGroups = $('.imovel_cx_caracteristicas')
    .map((_, group) => ({
      title: clean($(group).find('.cxSpan').first().text()),
      items: $(group)
        .find('.cxItem')
        .map((__, item) => clean($(item).text()))
        .get()
        .filter(Boolean),
    }))
    .get()
    .filter((group) => group.title && group.items.length > 0);

  // Full-size gallery photos, in page order. Thumbnails of other listings use a "thumb" prefix.
  const images: string[] = [];
  const seen = new Set<string>();
  $('a[href], img[src], img[data-src]').each((_, node) => {
    const src = $(node).attr('href') ?? $(node).attr('data-src') ?? $(node).attr('src') ?? '';
    const file = src.match(/imagens\/imoveis\/([^/?#"]+\.(?:jpe?g|png|webp))/i)?.[1];
    if (!file || /^thumb/i.test(file) || seen.has(file)) return;
    seen.add(file);
    images.push(`${CDN}/imagens/imoveis/${file}`);
  });

  return {
    legacyId,
    slug,
    url,
    code,
    type,
    purpose,
    city,
    state,
    neighborhood,
    title: city ? `${type} para ${purpose}, ${city} / ${state}` : `${type} para ${purpose}`,
    summary: rest,
    price: priceMatch ? number(priceMatch[1]) ?? null : null,
    address: fact('Endereço'),
    condominium: condominiumFact && !condoIsFee ? condominiumFact : undefined,
    inCondominium: fact('Em Condomínio') ? fact('Em Condomínio') === 'Sim' : undefined,
    condoFee: condoIsFee ? number(condominiumFact) : undefined,
    iptu: number(fact('IPTU')),
    area: number(fact('Área Útil')) ?? privateArea,
    builtArea: number(fact('Área Construída')),
    landArea: number(fact('Área Terreno', 'Área Total')),
    bedrooms: number(fact('Dormitórios', 'Dormitório')),
    suites: number(fact('Suítes', 'Suíte')),
    bathrooms: number(fact('Banheiros', 'Banheiro')),
    parking: number(fact('Vagas', 'Vaga')),
    livingRooms: number(fact('Salas', 'Sala')),
    description: textWithLineBreaks($, description),
    featureGroups,
    images,
  };
}
