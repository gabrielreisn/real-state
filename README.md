# Alex Nolasco Imóveis

Rebuild of [alexnolasco.com.br](https://www.alexnolasco.com.br): the landing page and one property page, running on static data for now.

| Path | What | Local URL |
| --- | --- | --- |
| [apps/web](apps/web) | Next.js website | http://localhost:3000 |
| [apps/api](apps/api) | NestJS API that stores contact form leads in Postgres | http://localhost:4000 |
| [apps/studio](apps/studio) | Sanity Studio with the content schemas | http://localhost:3333 |
| [infra](infra) | Kubernetes manifests | |
| [docker-compose.yml](docker-compose.yml) | Runs everything, including Postgres | |

## Run everything

```bash
docker compose up --build
```

The property page with full details is http://localhost:3000/imovel/3751584/apartamento-venda-vila-velha-es-praia-de-itaparica.

## Develop

Requires Node 26 and pnpm 12.

```bash
pnpm install
cp .env.example .env
pnpm db:up                 # Postgres only, in Docker
pnpm --filter api build
pnpm db:migrate
pnpm dev                   # web, API and Studio with hot reload
```

Run `pnpm test`, `pnpm typecheck` and `pnpm lint` before pushing.

## How data flows

- **Content** (listings, neighborhoods, contact details, featured listings) lives in Sanity. The web app reads it only through the functions in [apps/web/src/content/index.ts](apps/web/src/content/index.ts), Published edits reach the site within seconds: `<SanityLive />` listens for changes and revalidates only the cached queries they touch.
- **Images** are served by Sanity's image CDN. A custom `next/image` loader ([sanity-image-loader.ts](apps/web/src/lib/sanity-image-loader.ts)) requests each size with `auto=format` (WebP for browsers that support it) and a quality of 60, 75 or 85.
- **Pages** such as A Empresa (`/sobre`) and Financiamento are Sanity `page` documents, rendered by `apps/web/src/app/[page]`. They appear in the "Informações" menu in menu order.
- **Property submissions** from "Cadastre seu Imóvel" are validated by a server action and saved to Sanity as private documents (IDs like `submission.<uuid>`, never readable through the public API). They show up in Studio under "Cadastros de imóveis". The web app needs `SANITY_API_WRITE_TOKEN` for this.
- **Leads** go from the contact form through a server action to `POST /leads` on the API, then into Postgres. The API is never exposed publicly and has no endpoint for reading leads.

## Sanity

The Studio has two workspaces, one per dataset of project `1ai1aq1e`:

- **Produção** (`/production`): the real content, read by the deployed site.
- **Desenvolvimento** (`/development`): a scratch copy for imports and schema experiments, read by the site when it runs locally.

### Preview

Edits are drafts until published, and visitors only ever see published content. To see drafts on the site, open **Pré-visualização** in the Studio: it shows the site beside the editor, updates as you type, and clicking a text on the page opens its field. Each document also lists the pages it appears on.

How it works: the Studio calls `/api/draft-mode/enable` with a one-time secret, which switches on Next.js Draft Mode for that browser. In Draft Mode the same queries read drafts, uncached, with click-to-edit markers on display text (the fields in `EDITABLE` in [client.ts](apps/web/src/lib/sanity/client.ts); names, slugs and phone numbers stay clean because the site builds URLs from them). A banner with a "Sair" button shows when preview mode is on outside the Studio.

It needs a Viewer token as `SANITY_API_READ_TOKEN` in the web app, and the site's origin in the project's CORS settings with credentials allowed.

To fill a dataset from another, export and import it (`sanity dataset copy` needs a paid plan). Images keep their IDs, so references stay valid. The target must exist and is merged into, not replaced:

```bash
pnpm --filter studio exec sanity dataset export development /tmp/development.tar.gz
pnpm --filter studio exec sanity dataset import /tmp/development.tar.gz production
```

### Importing listings from the current site

The listings on www.alexnolasco.com.br (ImobiBrasil) can be imported into Sanity. This needs an Editor token in `.env` as `SANITY_API_WRITE_TOKEN`.

```bash
pnpm --filter studio import:crawl          # download every public listing page (1 per second)
pnpm --filter studio import                # dry run: report what would be imported and what looks wrong
pnpm --filter studio import -- --write     # import into "development" (add --dataset to target another)
```

Re-running is safe. Prices, rooms, areas and fees are refreshed from the old site; photos, descriptions and features are only filled in where missing, so edits made in Studio are kept. Downloaded pages and the photo upload log are cached in `apps/studio/import/.cache` (gitignored); delete the `pages` folder there to fetch fresh pages.

The Studio is hosted at https://alexnolasco.sanity.studio. Deploy changes to it with `pnpm --filter studio deploy`.

A listing with **"Anúncio no site antigo"** filled in still opens on the current site. Clear that field once the listing has its photos and description in Sanity, and it gets its own page here.
