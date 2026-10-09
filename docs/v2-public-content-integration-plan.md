# V2 public content integration – audit and rollout plan

Status: audit only. No production code or database schema is modified by this branch.

## Verified website source (main, 2026-10-09)
- `index.html` loads `merch-public-20260530.js`, `events.js`, `sponsors.js`, `media.js`.
- `merch-public-20260530.js` queries both V1 and V2 shop RPCs, uses `Promise.allSettled`, and filters duplicates.
- `events.js` queries V1 `get_public_events` and submits V1 `create_public_event_registration`.
- `sponsors.js` queries V1 `get_public_sponsors`.
- `media.js` queries V1 `get_public_media_items`.
- V2 migration `20260814125319_phase_32_public_website_integration.sql` defines `get_public_press` and `get_public_press_item`; this does NOT establish that the migration is deployed or that response fields match the website.

## Gate before code changes
1. Read-only inspect deployed V2 RPC signatures, grants, JSON result shapes and publication filters for events, sponsors, press.
2. Verify whether V2 sponsor public endpoint exists; do not assume it does.
3. Confirm Cloudflare production deployment matches the reviewed GitHub commit.
4. Test public endpoints using publishable/anon keys only; never ship service-role keys.
5. Agree on cross-version identity/deduplication rules and image URL mapping.

## Migration behavior
- Preserve V1 event registrations until an explicitly tested V2 registration route exists; do not mix event IDs between databases.
- Load V2 public data when endpoint and mapping are verified; otherwise retain V1 without blanking existing content.
- Never expose drafts, unpublished content, private contact data or privileged RPCs.
- Distinguish source for details, links and writes; use stable IDs and avoid silent name-only merging.
- Add test fixtures for V1-only, V2-only, duplicates, V2 outage, V1 outage, and malformed responses.
- Roll out behind a disabled-by-default configuration switch; review PR and deploy to preview before production.

## Acceptance criteria
- Existing V1 pages and registrations still work.
- Public V2 items appear only when published.
- No duplicate public items for explicitly matched identities.
- No browser secrets or privileged database grants.
- Successful preview tests, live RPC checks, and rollback plan documented.
