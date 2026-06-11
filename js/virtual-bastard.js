(() => {
  "use strict";

  const WIDGET_ID = "sb-vb-assistant";
  const ASSET_BASE = "/assets/virtual-bastard/";

  const actions = [
    { label: "Mitglied werden", href: "/mitglied-werden.html" },
    { label: "Events", href: "/index.html#events" },
    { label: "Shop & Fanartikel", href: "/index.html#public-dynamic" },
    { label: "Sponsoren", href: "/sponsoren.html" },
    { label: "Presse", href: "/presse.html" },
    { label: "Kontakt", href: "/kontakt.html" }
  ];

  function mascotMarkup(state = "idle", bubble = "speak") {
    const bubbleFile = bubble === "think" ? "vb-bubble-think.png" : "vb-bubble-speak.png";
    return `
      <div class="sb-vb-mascot sb-vb-state-${state}" aria-hidden="true">
        <img class="sb-vb-head" src="${ASSET_BASE}vb-head.png" alt="">
        <img class="sb-vb-head-speak" src="${ASSET_BASE}vb-head-speak.png" alt="">
        <img class="sb-vb-smoke" src="${ASSET_BASE}vb-smoke-large.png" alt="">
        <img class="sb-vb-glow" src="${ASSET_BASE}vb-glow.png" alt="">
        <img class="sb-vb-hand" src="${ASSET_BASE}vb-hand-wave.png" alt="">
        <img class="sb-vb-thumb" src="${ASSET_BASE}vb-thumb.png" alt="">
        <img class="sb-vb-bubble" src="${ASSET_BASE}${bubbleFile}" alt="">
      </div>`;
  }

  function createWidget() {
    const root = document.createElement("div");
    root.id = WIDGET_ID;
    root.className = "sb-vb-widget";

    root.innerHTML = `
      <button class="sb-vb-toggle" type="button"
        aria-label="Virtual Bastard Assistent öffnen"
        aria-expanded="false"
        aria-controls="sb-vb-panel">
        ${mascotMarkup("idle")}
      </button>

      <section class="sb-vb-panel" id="sb-vb-panel" role="dialog"
        aria-labelledby="sb-vb-title" hidden>
        <div class="sb-vb-panel-header">
          <strong class="sb-vb-title" id="sb-vb-title" tabindex="-1">Virtual Bastard</strong>
          <button class="sb-vb-close" type="button" aria-label="Virtual Bastard Assistent schließen">×</button>
        </div>
        <p class="sb-vb-message">Servus! Ich bin der Virtual Bastard. Wobei kann ich dir helfen?</p>
        <nav class="sb-vb-actions" aria-label="Virtual Bastard Schnellaktionen">
          ${actions.map((item) => `<a class="sb-vb-action" href="${item.href}">${item.label}</a>`).join("")}
        </nav>
      </section>
    `;

    document.body.appendChild(root);
    return root;
  }

  function setMascotState(root, state, bubble = "speak") {
    const toggle = root.querySelector(".sb-vb-toggle");
    const currentMascot = toggle.querySelector(".sb-vb-mascot");
    if (!currentMascot) return;

    currentMascot.className = `sb-vb-mascot sb-vb-state-${state}`;
    const bubbleImg = currentMascot.querySelector(".sb-vb-bubble");
    if (bubbleImg) {
      bubbleImg.src = `${ASSET_BASE}${bubble === "think" ? "vb-bubble-think.png" : "vb-bubble-speak.png"}`;
    }
  }

  function isCookieBannerVisible() {
    const candidates = [
      "#cookie-banner",
      ".cookie-banner",
      ".cookie-consent",
      "[data-cookie-banner]",
      "[id*='cookie' i]",
      "[class*='cookie' i]"
    ];

    return candidates.some((selector) => {
      try {
        return Array.from(document.querySelectorAll(selector)).some((el) => {
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
            return false;
          }
          const rect = el.getBoundingClientRect();
          return rect.width > 100 && rect.height > 20 && rect.bottom > window.innerHeight - 160;
        });
      } catch {
        return false;
      }
    });
  }

  function updateCookieOffset(root) {
    root.classList.toggle("sb-vb-cookie-offset", isCookieBannerVisible());
  }

  function init() {
    if (document.getElementById(WIDGET_ID)) return;

    const root = createWidget();
    const toggle = root.querySelector(".sb-vb-toggle");
    const panel = root.querySelector(".sb-vb-panel");
    const close = root.querySelector(".sb-vb-close");
    const title = root.querySelector(".sb-vb-title");

    function openPanel() {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Virtual Bastard Assistent schließen");
      setMascotState(root, "wave");
      window.setTimeout(() => setMascotState(root, "speak"), 750);
      window.setTimeout(() => title.focus({ preventScroll: true }), 0);
    }

    function closePanel() {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Virtual Bastard Assistent öffnen");
      setMascotState(root, "idle");
      toggle.focus({ preventScroll: true });
    }

    toggle.addEventListener("click", () => {
      if (panel.hidden) {
        openPanel();
      } else {
        closePanel();
      }
    });

    close.addEventListener("click", closePanel);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) {
        closePanel();
      }
    });

    document.addEventListener("click", (event) => {
      if (!panel.hidden && !root.contains(event.target)) {
        closePanel();
      }
    });

    root.querySelectorAll(".sb-vb-action").forEach((link, index) => {
      link.addEventListener("mouseenter", () => {
        if (index === 0 || index === 3) setMascotState(root, "success");
        else if (index === 1 || index === 2) setMascotState(root, "think", "think");
        else setMascotState(root, "speak");
      });
      link.addEventListener("mouseleave", () => {
        if (!panel.hidden) setMascotState(root, "speak");
      });
    });

    updateCookieOffset(root);
    window.addEventListener("resize", () => updateCookieOffset(root), { passive: true });

    const observer = new MutationObserver(() => updateCookieOffset(root));
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
