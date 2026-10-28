# News staging runtime preview

The existing Pages preview branch can run without changing its shared build command or creating another Pages project.

The `/api/news-staging-config` Pages Function reads `STB_NEWS_STAGING_PUBLISHABLE_KEY` from the **Preview** runtime environment. Configure only the public publishable/anon key for staging project `asrkcguvzscgtysnivsq`; never a secret/service-role key. The key is intentionally returned to preview browsers, never committed or logged. The handler withholds configuration on production/custom hosts and the project apex, and uses no-store responses.

Both press HTML variants load the runtime config before presse.js. Open `/presse?v2preview=1` on the preview deployment. Missing configuration leaves V2 disabled; V1 remains independently available. The existing build-generated config is retained for compatibility.

Run local handler checks with `node --test tests/news-staging-runtime.test.mjs`. These tests do not establish a successful Cloudflare deployment or full browser acceptance.

No production deployment, shared build-setting change or GitHub Action is required. Keep this change on `codex/news-homepage-staging-20261027` until acceptance. The deployment commit uses `[skip actions]` to suppress GitHub push/PR workflows without the Cloudflare Pages skip prefix.
