(() => {
  'use strict';

  const STORAGE_KEY = 'sbConsent';
  const LEGACY_KEY = 'sbCookiesAccepted';
  const CONSENT_VERSION = 1;
  const FACEBOOK_SELECTOR = 'iframe[src*="facebook.com/plugins"], iframe[data-src*="facebook.com/plugins"]';

  const state = {
    consent: null,
    lastFocused: null
  };

  const defaultConsent = () => ({
    version: CONSENT_VERSION,
    necessary: true,
    externalMedia: false,
    statistics: false,
    updatedAt: new Date().toISOString()
  });

  const readConsent = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || parsed.version !== CONSENT_VERSION) return null;
      return {
        ...defaultConsent(),
        ...parsed,
        necessary: true
      };
    } catch (_) {
      return null;
    }
  };

  const saveConsent = (next) => {
    state.consent = {
      ...defaultConsent(),
      ...next,
      version: CONSENT_VERSION,
      necessary: true,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.consent));
    localStorage.removeItem(LEGACY_KEY);
    applyConsent();
    document.dispatchEvent(new CustomEvent('sb:consent-changed', { detail: state.consent }));
  };

  const hasExternalMediaConsent = () => Boolean(state.consent?.externalMedia);

  const getFacebookUrl = (iframe) => iframe.dataset.src || iframe.getAttribute('src') || '';

  const replaceFacebookWithPlaceholder = (iframe) => {
    const url = getFacebookUrl(iframe);
    if (!url) return;

    iframe.dataset.src = url;
    iframe.removeAttribute('src');

    let placeholder = iframe.parentElement?.querySelector(':scope > .sb-external-placeholder');
    if (!placeholder) {
      placeholder = document.createElement('div');
      placeholder.className = 'sb-external-placeholder';
      placeholder.innerHTML = `
        <div class="sb-external-placeholder__content">
          <h3>Facebook-Inhalte blockiert</h3>
          <p>Der Facebook-Feed wird erst geladen, wenn du externe Medien erlaubst. Dabei können Daten an Meta übertragen werden.</p>
          <button type="button" class="sb-consent-button sb-consent-button--primary" data-sb-enable-facebook>
            Facebook-Inhalte aktivieren
          </button>
        </div>`;
      iframe.insertAdjacentElement('afterend', placeholder);
    }

    iframe.hidden = true;
    placeholder.hidden = false;
  };

  const enableFacebookIframe = (iframe) => {
    const url = iframe.dataset.src;
    if (!url) return;
    if (!iframe.getAttribute('src')) iframe.setAttribute('src', url);
    iframe.hidden = false;
    const placeholder = iframe.parentElement?.querySelector(':scope > .sb-external-placeholder');
    if (placeholder) placeholder.hidden = true;
  };

  const applyExternalMedia = () => {
    document.querySelectorAll(FACEBOOK_SELECTOR).forEach((iframe) => {
      if (hasExternalMediaConsent()) enableFacebookIframe(iframe);
      else replaceFacebookWithPlaceholder(iframe);
    });
  };

  const addFooterSettingsLink = () => {
    const legalNav = document.querySelector('.sb-footer-meta .sb-footer-links');
    if (!legalNav || legalNav.querySelector('[data-sb-open-consent]')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sb-cookie-settings-link';
    button.dataset.sbOpenConsent = '';
    button.textContent = 'Cookie-Einstellungen';
    legalNav.appendChild(button);
  };

  const removeLegacyBanner = () => {
    document.querySelector('#cookie-banner')?.remove();
  };

  const closeBanner = () => document.querySelector('.sb-consent-banner')?.remove();

  const closeModal = () => {
    document.querySelector('.sb-consent-backdrop')?.remove();
    document.body.style.overflow = '';
    state.lastFocused?.focus?.();
  };

  const openSettings = () => {
    closeModal();
    state.lastFocused = document.activeElement;

    const current = state.consent || defaultConsent();
    const backdrop = document.createElement('div');
    backdrop.className = 'sb-consent-backdrop';
    backdrop.innerHTML = `
      <section class="sb-consent-modal" role="dialog" aria-modal="true" aria-labelledby="sb-consent-title">
        <div class="sb-consent-modal__header">
          <div>
            <h2 id="sb-consent-title">Cookie-Einstellungen</h2>
            <p>Du entscheidest, welche optionalen Inhalte geladen werden. Deine Auswahl kannst du jederzeit ändern.</p>
          </div>
          <button type="button" class="sb-consent-close" aria-label="Einstellungen schließen" data-sb-close-consent>&times;</button>
        </div>

        <div class="sb-consent-category">
          <div class="sb-consent-category__row">
            <div>
              <h3>Notwendig</h3>
              <p>Diese Funktionen sind für den sicheren Betrieb der Website erforderlich und können nicht deaktiviert werden.</p>
            </div>
            <label class="sb-consent-switch" aria-label="Notwendige Funktionen immer aktiv">
              <input type="checkbox" checked disabled>
              <span></span>
            </label>
          </div>
        </div>

        <div class="sb-consent-category">
          <div class="sb-consent-category__row">
            <div>
              <h3>Externe Medien</h3>
              <p>Erlaubt eingebettete Inhalte wie den Facebook-Feed. Dabei können Daten an externe Anbieter übertragen werden.</p>
            </div>
            <label class="sb-consent-switch" aria-label="Externe Medien erlauben">
              <input type="checkbox" id="sb-consent-external" ${current.externalMedia ? 'checked' : ''}>
              <span></span>
            </label>
          </div>
        </div>

        <div class="sb-consent-category">
          <div class="sb-consent-category__row">
            <div>
              <h3>Statistik</h3>
              <p>Diese Kategorie ist vorbereitet, wird derzeit aber nicht verwendet.</p>
            </div>
            <label class="sb-consent-switch" aria-label="Statistik derzeit nicht verfügbar">
              <input type="checkbox" disabled>
              <span></span>
            </label>
          </div>
        </div>

        <p style="margin-top:18px">Weitere Informationen findest du in der <a href="/datenschutz.html">Datenschutzerklärung</a>.</p>

        <div class="sb-consent-modal__footer">
          <button type="button" class="sb-consent-button" data-sb-reject>Nur notwendige</button>
          <button type="button" class="sb-consent-button sb-consent-button--primary" data-sb-save>Auswahl speichern</button>
        </div>
      </section>`;

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    backdrop.querySelector('.sb-consent-close')?.focus();
  };

  const showBanner = () => {
    if (document.querySelector('.sb-consent-banner')) return;
    const banner = document.createElement('section');
    banner.className = 'sb-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Datenschutz-Einstellungen');
    banner.innerHTML = `
      <div class="sb-consent-banner__inner">
        <div>
          <h2>Wir respektieren deine Privatsphäre</h2>
          <p>Technisch notwendige Funktionen sind immer aktiv. Externe Inhalte wie Facebook laden wir erst nach deiner Zustimmung. Mehr dazu in der <a href="/datenschutz.html">Datenschutzerklärung</a>.</p>
        </div>
        <div class="sb-consent-actions">
          <button type="button" class="sb-consent-button" data-sb-reject>Nur notwendige</button>
          <button type="button" class="sb-consent-button" data-sb-open-consent>Einstellungen</button>
          <button type="button" class="sb-consent-button sb-consent-button--primary" data-sb-accept>Alle akzeptieren</button>
        </div>
      </div>`;
    document.body.appendChild(banner);
  };

  const applyConsent = () => {
    removeLegacyBanner();
    addFooterSettingsLink();
    applyExternalMedia();
    if (state.consent) closeBanner();
  };

  const handleClick = (event) => {
    const target = event.target.closest('button, [data-sb-open-consent]');
    if (!target) return;

    if (target.matches('[data-sb-open-consent]')) {
      event.preventDefault();
      openSettings();
    } else if (target.matches('[data-sb-close-consent]')) {
      closeModal();
    } else if (target.matches('[data-sb-accept]')) {
      saveConsent({ externalMedia: true, statistics: false });
    } else if (target.matches('[data-sb-reject]')) {
      saveConsent({ externalMedia: false, statistics: false });
      closeModal();
    } else if (target.matches('[data-sb-save]')) {
      saveConsent({
        externalMedia: Boolean(document.querySelector('#sb-consent-external')?.checked),
        statistics: false
      });
      closeModal();
    } else if (target.matches('[data-sb-enable-facebook]')) {
      saveConsent({ externalMedia: true, statistics: false });
    }
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape' && document.querySelector('.sb-consent-backdrop')) closeModal();
  };

  const observeDynamicContent = () => {
    const observer = new MutationObserver(() => {
      addFooterSettingsLink();
      applyExternalMedia();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };

  const init = () => {
    state.consent = readConsent();
    removeLegacyBanner();
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
    observeDynamicContent();
    applyConsent();
    if (!state.consent) showBanner();
  };

  window.SBConsent = {
    openSettings,
    getConsent: () => ({ ...(state.consent || defaultConsent()) }),
    hasExternalMediaConsent
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
