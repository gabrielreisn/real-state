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

## Google Analytics

The site uses GA4 measurement ID `G-754VY12EFX` by default. To override it, set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in the production deployment's build environment, then rebuild and deploy. On Vercel, set it for **Production**. For Docker Compose, set it in the root `.env` before building; direct Docker builds accept `--build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID=G-…`. Set the variable to an empty string to disable tracking.

The tag loads after hydration on every page. Tracking is disabled when the ID is empty or invalid, during `next dev`, on Vercel preview deployments, and in Sanity Draft Mode.

In the GA4 web stream, leave **Enhanced measurement → Page views → Page changes based on browser history events** enabled so navigation between pages is tracked. The site relies on [GA4's automatic pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views) rather than sending duplicate events. After deploying, open the site, navigate to a property, and check that both pageviews appear in GA4 Realtime.

## How data flows

- **Content** (listings, neighborhoods, contact details, featured listings) lives in Sanity. The web app reads it only through the functions in [apps/web/src/content/index.ts](apps/web/src/content/index.ts), Published edits reach the site within seconds: `<SanityLive />` listens for changes and revalidates only the cached queries they touch.
- **Images** are served by Sanity's image CDN. A custom `next/image` loader ([sanity-image-loader.ts](apps/web/src/lib/sanity-image-loader.ts)) requests each size with `auto=format` (WebP for browsers that support it) and a quality of 60, 75 or 85.
- **Pages** such as A Empresa (`/sobre`) and Financiamento are Sanity `page` documents, rendered by `apps/web/src/app/[page]`. They appear in the "Informações" menu in menu order.
- **Property submissions** from "Cadastre seu Imóvel" are validated by a server action and emailed through Resend. The email includes all contact and property fields and a WhatsApp contact button. These submissions no longer create Sanity records; existing records are preserved.
- **Leads** go from the property contact form through a server action to Resend. The notification includes the visitor's contact details, message, property code, price and link. When supplied, the visitor's email becomes Reply-To. A configured `API_INTERNAL_URL` also enables best-effort archival via `POST /leads` into Postgres. Email does not require that API to be deployed.

### Lead notification email

1. Connect the free [Resend Vercel integration](https://vercel.com/marketplace/resend) to the web project; it sets `RESEND_API_KEY`. For local development, set the key in the root `.env`.
2. Verify the sending domain in Resend by adding the DNS records it supplies. Use a domain you control; Hotmail can receive notifications but cannot be your Resend sending domain.
3. Set `LEAD_EMAIL_TO` (`alexnolascoimoveis@hotmail.com`) in the Vercel environment. The sender uses `contato@<RESEND_EMAIL_DOMAIN>` from the integration. Optionally override it with `LEAD_EMAIL_FROM` (for example, `Alex Nolasco Imóveis <contato@alexnolasco.com.br>`) after verifying that domain. Keep secrets server-side.
4. Set `SITE_URL` to the public website URL so email links point to the intended deployment. Redeploy after adding environment variables.
5. Production requires the existing Redis REST variables (`KV_REST_API_URL` / `KV_REST_API_TOKEN`, or their `UPSTASH_REDIS_REST_*` equivalents). Contact submissions are limited to five per IP per ten minutes, using hashed keys. The honeypot silently discards bots; Resend idempotency keys suppress identical submissions in the same ten-minute window.

For a delivery test, submit the property form with a real contact address and check both the Resend delivery log and the recipient inbox. Until sender and API credentials are configured, the form reports an error and offers WhatsApp instead of claiming an email was sent.

Both contact and owner-submission emails use this configuration. Before domain verification, set `LEAD_EMAIL_FROM=Alex Nolasco Imóveis <onboarding@resend.dev>` and set `LEAD_EMAIL_TO` to the email associated with your Resend account. This test sender can only email that account address. Once the domain is verified, remove the sender override and set the production recipient.

Generate HTML previews without sending email:

```bash
pnpm dlx tsx apps/web/scripts/preview-emails.ts /tmp/real-state-email-previews
```

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
