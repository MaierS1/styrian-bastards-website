// V2 events release candidate: review preview and verify published records before merge.
// V2 event cards are read-only; V1 registrations remain unchanged.
// Roll back events by setting STB_V2_EVENTS_ENABLED to stbV2Preview.
const stbV2Preview = (() => {
  const host = window.location.hostname.toLowerCase();
  const isProduction = host === 'styrian-bastards.at' || host === 'www.styrian-bastards.at';
  const params = new URLSearchParams(window.location.search);
  return !isProduction && params.get('v2preview') === '1';
})();
window.STB_V2_PRESS_ENABLED = true;
window.STB_V2_EVENTS_ENABLED = true;
window.STB_V2_SPONSORS_ENABLED = stbV2Preview;
