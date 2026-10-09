// V2 press rollout candidate. Merge only after preview review and release approval.
// Other V2 public content stays preview-only. Disable press quickly by reverting
// STB_V2_PRESS_ENABLED to stbV2Preview and redeploying.
const stbV2Preview = (() => {
  const host = window.location.hostname.toLowerCase();
  const isProduction = host === 'styrian-bastards.at' || host === 'www.styrian-bastards.at';
  const params = new URLSearchParams(window.location.search);
  return !isProduction && params.get('v2preview') === '1';
})();
window.STB_V2_PRESS_ENABLED = true;
window.STB_V2_EVENTS_ENABLED = stbV2Preview;
window.STB_V2_SPONSORS_ENABLED = stbV2Preview;
