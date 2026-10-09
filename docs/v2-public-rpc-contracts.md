# Verified V2 public RPC contracts (source-level)

Source: `MaierS1/styrian-bastards-manager-v2` migrations. **Migration application and live grants are NOT verified.**

## Events
Migration: `20260810182333_phase_25_5_public_homepage.sql`.
`public.get_public_events(p_limit integer default 20, p_after timestamptz default null, p_after_id uuid default null)` returns:
`id, title, summary, starts_at, ends_at, location_name, registration_state, waitlist_available`.
Filters `status='published'`, `visibility='public'`, future events only; capped at 50.
V1 website `events.js` currently calls V1 `get_public_events` and V1 `create_public_event_registration`. **Do not render V2 registration forms with V1 event IDs.** V2 list/detail needs source-aware rendering and registration routing or read-only V2 cards until V2 intake is validated.

## Press
Migration: `20260814125319_phase_32_public_website_integration.sql`.
`public.get_public_press(p_limit integer default 20, p_after timestamptz default null)` returns:
`id, slug, title, published_at, teaser, content_html, image_path, category`.
Only `status='published'`, with `published_at <= now()`; capped at 50. Explicit `anon` execute grant in migration.
V1 website `media.js` currently calls V1 `get_public_media_items`. These contracts are not interchangeable without a presentation mapper. Treat HTML as untrusted unless sanitizer and policy verified.

## Sponsors
No V2 public sponsor RPC confirmed in the inspected migrations. **Blocked for V2 integration until a published-only RPC contract and anon grants are verified/implemented.** Never query private sponsor records directly from the public browser.

## Live release checklist
1. Read-only verify migrations/functions, grants and sample response shapes in V2.
2. Verify Cloudflare deployment commit and browser network requests.
3. Implement source-aware V2 read adapters behind default-off feature flags.
4. Ensure V1 event registration continues working and V2 events never write to V1.
5. Preview: V1-only/V2-only/duplicate/outage/publication/HTML-injection tests.
6. Merge only after review and documented rollback.
