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

- **Content** (listings, neighborhoods, contact details, featured listings) lives in Sanity. The web app reads it only through the functions in [apps/web/src/content/index.ts](apps/web/src/content/index.ts), and edits appear on the site within a minute.
- **Images** are served by Sanity's image CDN. A custom `next/image` loader ([sanity-image-loader.ts](apps/web/src/lib/sanity-image-loader.ts)) requests each size with `auto=format` (WebP for browsers that support it) and a quality of 60, 75 or 85.
- **Leads** go from the contact form through a server action to `POST /leads` on the API, then into Postgres. The API is never exposed publicly and has no endpoint for reading leads.

## Sanity

Local development uses the `development` dataset of project `1ai1aq1e`; production will use `production`. The content was imported into `development` once. To fill another dataset, copy it:

```bash
pnpm --filter studio exec sanity dataset copy development production
```

The Studio is hosted at https://alexnolasco.sanity.studio. Deploy changes to it with `pnpm --filter studio deploy`.

A listing with **"Anúncio no site antigo"** filled in still opens on the current site. Clear that field once the listing has its photos and description in Sanity, and it gets its own page here.
