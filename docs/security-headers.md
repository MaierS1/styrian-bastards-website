# Security Headers

## CSP source inventory

The production CSP in `_headers` is intentionally host-based and avoids broad wildcards.

- Own site: `'self'`, `https://www.styrian-bastards.at`
- Google Fonts CSS: `https://fonts.googleapis.com`
- Google Fonts files: `https://fonts.gstatic.com`
- Font Awesome CDN: `https://cdnjs.cloudflare.com`
- Supabase API and Edge Functions: `https://ekaxdyysefmypkainhij.supabase.co`
- Supabase browser client CDN: `https://cdn.jsdelivr.net`
- Facebook page plugin after consent: `https://www.facebook.com`
- Cloudinary gallery upload/list/images: `https://api.cloudinary.com`, `https://res.cloudinary.com`
- Web3Forms contact submit: `https://api.web3forms.com`
- Unsplash image used by the 404 page: `https://images.unsplash.com`

No direct browser source for Resend is currently used. Resend should stay server-side only, for example behind Supabase Edge Functions.

## HSTS on Cloudflare

Configure HSTS in Cloudflare, not in `_headers`, after HTTPS is verified for every hostname:

- Enable: Strict-Transport-Security
- Recommended value: `max-age=31536000; includeSubDomains; preload`
- Preconditions: all subdomains must serve valid HTTPS before `includeSubDomains` and `preload` are enabled.
- Cloudflare path: SSL/TLS -> Edge Certificates -> HTTP Strict Transport Security (HSTS).

Start with a shorter `max-age` during rollout if there is uncertainty about subdomain HTTPS coverage.

## COOP, COEP, CORP

- `Cross-Origin-Opener-Policy: same-origin` is enabled.
- `Cross-Origin-Resource-Policy: same-site` is enabled to protect same-site static resources without blocking normal same-site use.
- `Cross-Origin-Embedder-Policy` is intentionally not enabled. `require-corp` would likely break third-party embeds and assets, especially the Facebook page plugin after consent, unless every external resource emitted compatible CORP/CORS headers.

## Known hardening follow-ups

- Executable inline scripts and inline styles have been moved to external files. `script-src` and `style-src` no longer require `'unsafe-inline'`.
- JSON-LD structured data remains inline on `index.html` and `faq.html`; both blocks are allowed through SHA-256 hashes in `script-src`.
- External CDN resources currently do not use SRI. Candidates for future SRI are Font Awesome from `cdnjs.cloudflare.com` and the Supabase browser client from `cdn.jsdelivr.net`. Do not add SRI until the exact CDN versions are pinned.
- The Facebook iframe remains blocked by consent markup and only receives `src` after `external-media` consent.
