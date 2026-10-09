// Production remains disabled. Preview opt-in requires an explicit URL parameter
// and never activates on the canonical production hostname.
const stbV2Preview = (() => {
  const host = window.location.hostname.toLowerCase();
  const isProduction = host === 'styrian-bastards.at' || host === 'www.styrian-bastards.at';
  const params = new URLSearchParams(window.location.search);
  return !isProduction && params.get('v2preview') === '1';
})();
window.STB_V2_PRESS_ENABLED = stbV2Preview;
window.STB_V2_EVENTS_ENABLED = stbV2Preview;
window.STB_V2_SPONSORS_ENABLED = stbV2Preview;
