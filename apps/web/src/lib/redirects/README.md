Legacy URLs reported by Search Console resolve in `src/proxy.ts` with permanent (308)
redirects. Resolving the old path and removing `amp` together avoids sending mobile
property links through an obsolete desktop URL first.

`legacy-properties.json` maps the old ImobiBrasil IDs to current canonical property
paths. It was generated from the original migration archive (`import/.cache/urls.json`
and HTML parsed with `apps/studio/import/parse.ts`), matched by property code against
https://www.alexnolasco.com.br/sitemap.xml on 2026-11-16. All 259 destinations appeared
in the production sitemap. Three archived properties were absent (legacy IDs 3341757,
3338318, 3337772; codes 1010, 1005, 1002), so no replacement was invented for them.
Unknown property IDs retain normal not-found handling.

`legacy-neighborhoods.json` maps 74 old neighborhood IDs, extracted from archived
search links, to current city/neighborhood paths verified against that sitemap.
These are search pages, not individual properties. The ID is authoritative when a
legacy URL has the wrong city, such as `vitoria/itapua-543995` (actually Vila Velha).
Unmapped neighborhood slugs have their obsolete numeric suffix removed.

Search routes translate type slugs to the exact production filter labels and `pag`
to `pagina` (omitting page 1). Existing bedroom, price and tracking parameters remain.
AMP parameters are removed from current pages as well. The regression tests cover
all 20 examples visible in the two Search Console screenshots; every resulting
example destination returned HTTP 200 on production during validation.
