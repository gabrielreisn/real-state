import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageBody } from '@/components/page/PageBody';
import { PropertySubmissionForm } from '@/components/page/PropertySubmissionForm';
import { JsonLd } from '@/components/JsonLd';
import { getPage, getPageSlugs, getSiteSettings, SITE_URL } from '@/content';
import { pageGraph } from '@/lib/seo/jsonld';
import { openGraphDefaults } from '@/lib/seo/metadata';

type Params = Promise<{ page: string }>;

// Prerendered at build, refreshed every minute; pages added in Sanity later render on first visit.
export const revalidate = 60;
export const generateStaticParams = getPageSlugs;

async function loadPage(params: Params) {
  const { page: slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return page;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = await loadPage(params);
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: { ...openGraphDefaults, type: page.slug === 'sobre' ? 'profile' : 'website', title: page.title, description: page.description, url: `/${page.slug}` },
  };
}

export default async function InformationPage({ params }: { params: Params }) {
  const [page, site] = await Promise.all([loadPage(params), getSiteSettings()]);

  return (
    <>
      <div className="bg-navy text-white [--focus:#fff]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
          <h1 className="text-[2rem] leading-tight font-bold tracking-tight md:text-[2.75rem]">{page.title}</h1>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <PageBody value={page.body} />
        {page.form === 'propertySubmission' ? (
          <aside aria-labelledby="formulario-titulo" className="self-start border border-line bg-mist p-6 lg:sticky lg:top-[calc(var(--header-offset)+1rem)]">
            <h2 id="formulario-titulo" className="mb-5 text-2xl font-bold">
              {page.formTitle ?? 'Informações sobre o imóvel'}
            </h2>
            <PropertySubmissionForm whatsapp={site.whatsapp} />
          </aside>
        ) : null}
      </div>
      <JsonLd
        data={pageGraph({
          siteUrl: SITE_URL,
          page,
          breadcrumbs: [
            { label: 'Início', href: '/' },
            { label: page.title, href: `/${page.slug}` },
          ],
        })}
      />
    </>
  );
}
