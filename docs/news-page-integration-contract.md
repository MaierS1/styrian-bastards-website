# /news integration – development contract

Status: Planning/implementation branch only; no production changes.

- Add dedicated public routes `/news` and `/news/:slug` in the website's existing routing conventions.
- Preserve `/presse` and all existing press content and navigation.
- Source of truth is V2 Supabase public RPC `get_public_news` / `get_public_news_item` (to be implemented in the V2 branch).
- Never query internal V2 tables directly or expose service-role credentials.
- Display only approved, published, website-enabled entries whose publication timestamp has arrived.
- Provide responsive cards, detail view, cover image alt text, empty/loading/error states, and SEO metadata.
- Add optional latest-news preview on homepage, using the same public contract.
- Coordinate RPC signature and content types with V2 before implementing live fetches.
- Test at 375, 390, 768, and 1024px; preserve existing pages.
- No production deployment before staging verification and explicit approval.
