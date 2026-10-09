// V2 sponsors release candidate: review Cloudflare preview before merging.
// V1 sponsors remain available independently; press and events stay enabled.
// Roll back sponsors by setting STB_V2_SPONSORS_ENABLED to stbV2Preview.
const stbV2Preview = (() => {
  const host = window.location.hostname.toLowerCase();
  const isProduction = host === 'styrian-bastards.at' || host === 'www.styrian-bastards.at';
  const params = new URLSearchParams(window.location.search);
  return !isProduction && params.get('v2preview') === '1';
})();
window.STB_V2_PRESS_ENABLED = true;
window.STB_V2_EVENTS_ENABLED = true;
window.STB_V2_SPONSORS_ENABLED = true;
