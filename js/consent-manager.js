(function () {
    'use strict';

    if (
        window.StyrianConsentManager &&
        (window.StyrianConsentManager.initialized || window.StyrianConsentManager.loading)
    ) {
        return;
    }

    window.StyrianConsentManager = {
        loading: true,
        initialized: false
    };

    const STORAGE_KEY = 'sbConsentSettings';
    const LEGACY_KEY = 'sbCookiesAccepted';
    const CONSENT_VERSION = '2026-07-18';
    const CATEGORY_EXTERNAL_MEDIA = 'external-media';
    const FOCUSABLE_SELECTOR = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    const defaultConsent = Object.freeze({
        necessary: true,
        externalMedia: false
    });

    let state = loadState();
    let initialized = false;
    let previousFocus = null;

    function normalizeCategory(category) {
        return category === CATEGORY_EXTERNAL_MEDIA ? 'externalMedia' : category;
    }

    function loadState() {
        let parsed = null;

        try {
            parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch (error) {
            parsed = null;
        }

        const versionMatches = parsed && parsed.version === CONSENT_VERSION;
        const categories = parsed && parsed.categories && typeof parsed.categories === 'object'
            ? parsed.categories
            : {};

        return {
            version: parsed && parsed.version ? parsed.version : null,
            decided: Boolean(parsed && parsed.decided && versionMatches),
            categories: {
                necessary: true,
                externalMedia: versionMatches ? Boolean(categories.externalMedia) : false
            }
        };
    }

    function persistState() {
        const payload = {
            version: CONSENT_VERSION,
            decided: true,
            categories: {
                necessary: true,
                externalMedia: Boolean(state.categories.externalMedia)
            },
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        localStorage.removeItem(LEGACY_KEY);
        state = loadState();
    }

    function hasConsent(category) {
        const key = normalizeCategory(category);
        return key === 'necessary' || Boolean(state.categories[key]);
    }

    function setConsent(nextCategories) {
        state.categories = {
            ...defaultConsent,
            ...state.categories,
            ...nextCategories,
            necessary: true
        };
        state.version = CONSENT_VERSION;
        state.decided = true;
        persistState();
        applyConsent();
        hideBanner();
        closeModal();
        document.dispatchEvent(new CustomEvent('sb:consent-changed', {
            detail: {
                categories: { ...state.categories },
                version: CONSENT_VERSION
            }
        }));
    }

    function acceptNecessary() {
        setConsent({ externalMedia: false });
    }

    function acceptAll() {
        setConsent({ externalMedia: true });
    }

    function saveSettings() {
        const externalMediaInput = document.querySelector('[data-consent-input="external-media"]');
        setConsent({ externalMedia: Boolean(externalMediaInput && externalMediaInput.checked) });
    }

    function applyConsent() {
        const externalMediaAllowed = hasConsent(CATEGORY_EXTERNAL_MEDIA);

        document.querySelectorAll('[data-consent-category="external-media"][data-src]').forEach((element) => {
            const container = element.closest('.facebook-feed-inner');

            if (externalMediaAllowed) {
                if (!element.getAttribute('src')) {
                    element.setAttribute('src', element.getAttribute('data-src'));
                }
                if (container) {
                    container.hidden = false;
                }
                return;
            }

            element.removeAttribute('src');
            if (container) {
                container.hidden = true;
            }
        });

        document.querySelectorAll('[data-external-media-placeholder]').forEach((placeholder) => {
            placeholder.hidden = externalMediaAllowed;
        });
    }

    function ensureUi() {
        if (!document.getElementById('sb-consent-banner')) {
            document.body.insertAdjacentHTML('beforeend', bannerMarkup());
        }

        if (!document.getElementById('sb-consent-modal')) {
            document.body.insertAdjacentHTML('beforeend', modalMarkup());
        }
    }

    function bannerMarkup() {
        return `
<section class="sb-consent-banner" id="sb-consent-banner" role="region" aria-label="Cookie- und Datenschutzeinstellungen" hidden>
    <div class="sb-consent-banner-inner">
        <div>
            <p class="sb-consent-kicker">Datenschutz &amp; Cookies</p>
            <p class="sb-consent-copy">
                Wir verwenden notwendige Funktionen und laden externe Medien wie Facebook erst nach deiner Einwilligung.
                Details findest du in der <a href="/datenschutz.html">Datenschutzerkl&auml;rung</a>.
            </p>
        </div>
        <div class="sb-consent-actions">
            <button type="button" class="sb-consent-button sb-consent-button-secondary" data-consent-necessary>Nur notwendige</button>
            <button type="button" class="sb-consent-button sb-consent-button-secondary" data-consent-open>Einstellungen</button>
            <button type="button" class="sb-consent-button sb-consent-button-primary" data-consent-accept-all>Alle akzeptieren</button>
        </div>
    </div>
</section>`;
    }

    function modalMarkup() {
        return `
<div class="sb-consent-modal" id="sb-consent-modal" role="dialog" aria-modal="true" aria-labelledby="sb-consent-title" hidden>
    <div class="sb-consent-dialog" role="document" tabindex="-1">
        <div class="sb-consent-dialog-header">
            <h2 class="sb-consent-dialog-title" id="sb-consent-title">Cookie-Einstellungen</h2>
            <button type="button" class="sb-consent-close" data-consent-close aria-label="Cookie-Einstellungen schlie&szlig;en">&times;</button>
        </div>
        <div class="sb-consent-dialog-body">
            <p class="sb-consent-copy">
                Hier kannst du festlegen, welche Inhalte geladen werden. Notwendige Funktionen bleiben immer aktiv.
            </p>

            <section class="sb-consent-category">
                <div class="sb-consent-category-head">
                    <div>
                        <h3>Notwendige Funktionen</h3>
                        <p>Speichern deine Auswahl und stellen Grundfunktionen der Website bereit.</p>
                    </div>
                    <label class="sb-consent-switch">
                        <input type="checkbox" checked disabled>
                        Aktiv
                    </label>
                </div>
            </section>

            <section class="sb-consent-category">
                <div class="sb-consent-category-head">
                    <div>
                        <h3>Externe Medien</h3>
                        <p>L&auml;dt eingebettete Inhalte von Drittanbietern, derzeit den Facebook-Feed.</p>
                    </div>
                    <label class="sb-consent-switch">
                        <input type="checkbox" data-consent-input="external-media">
                        Aktiv
                    </label>
                </div>
            </section>

            <div class="sb-consent-dialog-actions">
                <button type="button" class="sb-consent-button sb-consent-button-secondary" data-consent-necessary>Nur notwendige</button>
                <button type="button" class="sb-consent-button sb-consent-button-primary" data-consent-save>Auswahl speichern</button>
                <button type="button" class="sb-consent-button sb-consent-button-primary" data-consent-accept-all>Alle akzeptieren</button>
            </div>
        </div>
    </div>
</div>`;
    }

    function syncInputs() {
        document.querySelectorAll('[data-consent-input="external-media"]').forEach((input) => {
            input.checked = hasConsent(CATEGORY_EXTERNAL_MEDIA);
        });
    }

    function showBannerIfNeeded() {
        const banner = document.getElementById('sb-consent-banner');
        if (banner) {
            banner.hidden = state.decided;
        }
    }

    function hideBanner() {
        const banner = document.getElementById('sb-consent-banner');
        if (banner) {
            banner.hidden = true;
        }
    }

    function openModal() {
        ensureUi();
        syncInputs();
        previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        const modal = document.getElementById('sb-consent-modal');
        const dialog = modal ? modal.querySelector('.sb-consent-dialog') : null;

        if (modal) {
            modal.hidden = false;
        }

        requestAnimationFrame(() => {
            const firstFocusable = modal ? modal.querySelector(FOCUSABLE_SELECTOR) : null;
            (firstFocusable || dialog || modal).focus();
        });
    }

    function closeModal() {
        const modal = document.getElementById('sb-consent-modal');
        if (!modal || modal.hidden) {
            return;
        }

        modal.hidden = true;

        if (previousFocus && document.contains(previousFocus)) {
            previousFocus.focus();
        }

        previousFocus = null;
    }

    function trapFocus(event) {
        if (event.key !== 'Tab') {
            return;
        }

        const modal = document.getElementById('sb-consent-modal');
        if (!modal || modal.hidden) {
            return;
        }

        const focusable = Array.from(modal.querySelectorAll(FOCUSABLE_SELECTOR))
            .filter((element) => element.offsetParent !== null);

        if (!focusable.length) {
            event.preventDefault();
            modal.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function handleDocumentClick(event) {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) {
            return;
        }

        if (target.closest('[data-consent-open]')) {
            event.preventDefault();
            openModal();
            return;
        }

        if (target.closest('[data-consent-close]')) {
            event.preventDefault();
            closeModal();
            return;
        }

        if (target.closest('[data-consent-necessary]')) {
            event.preventDefault();
            acceptNecessary();
            return;
        }

        if (target.closest('[data-consent-accept-all]')) {
            event.preventDefault();
            acceptAll();
            return;
        }

        if (target.closest('[data-consent-save]')) {
            event.preventDefault();
            saveSettings();
            return;
        }

        const categoryButton = target.closest('[data-consent-enable]');
        if (categoryButton) {
            event.preventDefault();
            const category = categoryButton.getAttribute('data-consent-enable');
            if (category === CATEGORY_EXTERNAL_MEDIA) {
                setConsent({ externalMedia: true });
            }
        }
    }

    function handleDocumentKeydown(event) {
        if (event.key === 'Escape') {
            closeModal();
            return;
        }

        trapFocus(event);
    }

    function observeDynamicContent() {
        const observer = new MutationObserver(() => {
            applyConsent();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function init() {
        if (initialized) {
            return;
        }

        initialized = true;
        window.StyrianConsentManager = {
            loading: false,
            initialized: true,
            version: CONSENT_VERSION,
            hasConsent,
            openSettings: openModal,
            acceptAll,
            acceptNecessary,
            setExternalMediaConsent: function (allowed) {
                setConsent({ externalMedia: Boolean(allowed) });
            }
        };

        localStorage.removeItem(LEGACY_KEY);
        ensureUi();
        syncInputs();
        applyConsent();
        showBannerIfNeeded();
        observeDynamicContent();

        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleDocumentKeydown);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
