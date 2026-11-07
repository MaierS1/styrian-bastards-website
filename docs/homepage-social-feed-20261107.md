# Homepage Facebook and Instagram feed

The approved homepage previously read V2 website publications and legacy press. The production V2 table currently contains only archived technical tests, so manually published Meta posts never appeared.

Added public read-only social-public-feed Edge Function for the fixed club Page 766538236534766 and Instagram account 17841476009175873. It reuses the existing healthy encrypted Meta authorization, resolves the verified Page credential internally, then performs GET requests for published Page posts and Instagram media. No posting, editing, deleting, order or payment operations occur. Credentials/provider errors never enter public responses or logs. The website receives only explicit public post fields, original post permalinks, channel labels and image proxy URLs.

Both the server and browser refresh every five minutes (server refresh is on demand). Homepage News retain a dedicated slot (latest V2 website news, or newest published press if no website News exist). The latest accessible Facebook and Instagram items each receive the remaining slots. Social items cannot displace Homepage News, even when newer. Original social posts open on their respective platform. If a provider is unavailable, V2 News/Press and V1 press remain independent fallback sources. Hidden/unpublished posts, inaccessible shared content and archived V2 technical-test publications are excluded.

Images are proxied via an exact post ID, never arbitrary request URLs; fixed HTTPS Meta CDN allowlist, image MIME and size limits. This preserves existing CSP and avoids browser requests to Meta for the preview cards. Content appears as text nodes; no social scripts or embeds are loaded. Public feed is tokenless because it exposes only already-public club posts.

Validation: 31 executable tests including latest-per-channel reservation, missing sources, unsafe links, shared-post image mapping, video thumbnails, explicit public projection, unavailable shares and proxy host validation. Build and live feed/image checks. Existing header/footer, Abo campaigns and providers' posts are unchanged.
