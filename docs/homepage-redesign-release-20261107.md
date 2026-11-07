# Homepage redesign — 7 November 2026

Approved design replaces only index.html and adds isolated hp-* CSS/JS and font stylesheet assets. Navbar/footer markup, their scripts/styles, hero.jpg, existing subpages, calendar subscription service, public APIs, database records, orders and payments are unchanged.

Content: next three ATSE fixtures with automatic five-minute refresh and calendar subscription link; live public partners; two currently available V2 shop products with source-qualified detail links; public Abo visibility/sales status; three published news/media records with independent V2 News, V2 Press and V1 fallbacks; upcoming public events. No design samples or preview controls are shipped. Fixed original navigation height is measured to reserve space on desktop/mobile. Existing #about, #events and #facebook-feed links remain valid.

Public Abo projection currently reports sales_open=false and a technical test campaign. Homepage therefore displays information-only CTA and does not advertise an open sale or a technical campaign identifier. No campaign configuration was changed.

Validation: npm run build; node --test tests/*.test.mjs (22 passed); desktop and 375px content-width browser QA; live public feed data, game/date-only handling, source-qualified links, partner and product reads, Abo visibility/failure paths. Navbar/footer and their CSS are byte-identical to the backup commit.

## Rollback

Backup branch: backup/startseite-vor-redesign-2026-11-07
Backup commit: fc8228e35b1271380e0cf4511b52468f33296b59

To restore the previous homepage without affecting subsequent unrelated changes, restore index.html from that commit into the current production branch, commit with [skip actions], and publish through the existing Cloudflare Git integration. The old CSS/JS files remain present, and the old homepage uses the existing full calendar service. No force-push or database rollback is needed. New hp-* assets may remain unused.
