# CSP Cleanup

## Inline inventory

The HTML audit covered all website HTML files outside `dist/` and `.git/`.

Found before cleanup:

- Executable inline script blocks in `datenschutz.html`, `event.html`, `faq.html`, `galerie-admin.html`, `galerie.html`, `impressum.html`, `index.html`, `kontakt.html`, `merch.html`, `mitglied-werden.html`, `mitgliederbereich.html`, `presse.html`, `presse/index.html`, and `sponsoren.html`.
- Inline style blocks in the page templates and shared fragments, including `navbar.html` and `footer.html`.
- Inline `style=""` attributes in `index.html` and `mitglied-werden.html`.
- No inline event handler attributes such as `onclick`, `onload`, `onchange`, `onsubmit`, or `oninput`.
- No `javascript:` URLs.

Remaining inline blocks:

- `index.html`: JSON-LD structured data, allowed by CSP hash `sha256-lCXAr6hNi8ajgejWRK6T1vtbx/F/Qf3tUBN4s9dF76g=`.
- `faq.html`: JSON-LD structured data, allowed by CSP hash `sha256-1PugMf7WEgpN53Y/s/pIR7Uxx2/g7Lm7T2puTgEgF94=`.

## Extracted files

CSS was moved to page or fragment-specific files under `css/extracted/`.

- `404.css`
- `datenschutz.css`
- `event.css`
- `faq.css`
- `footer.css`
- `galerie-admin.css`
- `galerie.css`
- `home.css`
- `impressum.css`
- `kontakt.css`
- `merch.css`
- `mitglied-werden.css`
- `mitgliederbereich.css`
- `navbar.css`
- `presse.css`

JavaScript was moved to position-preserving files under `js/extracted/`.

- `datenschutz.js`
- `event.js`, `event-2.js`
- `faq.js`
- `galerie-admin.js`
- `galerie.js`
- `home.js`, `home-2.js`, `home-3.js`
- `impressum.js`
- `kontakt.js`
- `merch.js`
- `mitglied-werden.js`, `mitglied-werden-2.js`
- `mitgliederbereich.js`
- `presse.js`
- `sponsoren.js`

## Remaining exceptions

- JSON-LD is intentionally left inline for search engine compatibility and is covered by CSP hashes.
- External CDN scripts and styles still depend on explicit host allowlists. SRI should be added after CDN versions are pinned.
- The fetched `navbar.html` and `footer.html` fragments now load external CSS files instead of embedding `<style>` blocks.

## Recommended next CSP stage

The current `_headers` CSP can run without `'unsafe-inline'`:

- `script-src 'self' <json-ld-hashes> https://cdn.jsdelivr.net`
- `style-src 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com`

Recommended follow-ups:

- Pin the Supabase browser client and Font Awesome CDN URLs to exact immutable versions and add SRI.
- Move JSON-LD generation to a build step that can automatically recalculate hashes when the JSON changes.
- Keep Facebook limited to `frame-src https://www.facebook.com` and continue loading the iframe only after `external-media` consent.
