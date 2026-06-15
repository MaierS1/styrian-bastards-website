(() => {
  "use strict";

  const WIDGET_ID = "sb-vb-assistant";
  const ASSET_BASE = "/assets/virtual-bastard/";
  const KNOWLEDGE_URL = "/assets/data/virtual-bastard-knowledge.json";
  const UNKNOWN_ANSWER = "Das wei\u00df ich noch nicht sicher. Schau bitte in der FAQ nach oder kontaktiere uns direkt.";

  const actions = [
    { label: "Mitglied werden", href: "/mitglied-werden.html" },
    { label: "Events", href: "/index.html#events" },
    { label: "Shop & Fanartikel", href: "/index.html#public-dynamic" },
    { label: "Sponsoren", href: "/sponsoren.html" },
    { label: "Presse", href: "/presse.html" },
    { label: "Kontakt", href: "/kontakt.html" }
  ];

  const fallbackKnowledge = [
    {
      id: "mitgliedschaft",
      title: "Mitgliedschaft",
      keywords: ["mitgliedschaft", "mitglied", "beitreten"],
      answer: "Infos zur Mitgliedschaft findest du auf der Seite Mitglied werden.",
      links: [{ label: "Mitglied werden", href: "/mitglied-werden.html" }]
    },
    {
      id: "faq",
      title: "FAQ",
      keywords: ["faq", "fragen", "hilfe"],
      answer: UNKNOWN_ANSWER,
      links: [
        { label: "FAQ", href: "/faq.html" },
        { label: "Kontakt", href: "/kontakt.html" }
      ]
    }
  ];

  const state = {
    knowledge: fallbackKnowledge
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function normalize(value) {
    return String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  async function loadKnowledge() {
    try {
      const response = await fetch(KNOWLEDGE_URL, { headers: { Accept: "application/json" } });
      if (!response.ok) {
        throw new Error(`Knowledge request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Knowledge response is not an array");
      }

      const entries = data.filter((entry) => entry && entry.id && entry.title && entry.answer);
      if (entries.length) {
        state.knowledge = entries;
      }
    } catch (error) {
      console.warn("Could not load Virtual Bastard knowledge", error);
      state.knowledge = fallbackKnowledge;
    }
  }

  function findAnswer(query) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return null;

    const queryWords = normalizedQuery.split(" ").filter(Boolean);

    return state.knowledge.find((entry) => {
      const title = normalize(entry.title);
      const haystackWords = normalize([
        entry.id,
        entry.title,
        ...(Array.isArray(entry.keywords) ? entry.keywords : [])
      ].join(" ")).split(" ").filter(Boolean);
      const haystack = haystackWords.join(" ");

      if (!haystack) return false;
      if (haystack.includes(normalizedQuery) || (title && normalizedQuery.includes(title))) {
        return true;
      }

      return queryWords.some((word) => word.length > 2 && haystackWords.includes(word));
    }) || null;
  }

  function linksMarkup(links) {
    if (!Array.isArray(links) || !links.length) return "";

    return `
      <div class="sb-vb-chat-links">
        ${links.map((link) => {
          const href = String(link?.href || "").trim();
          const label = String(link?.label || href).trim();
          if (!href || !label) return "";
          return `<a class="sb-vb-chat-link" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
        }).join("")}
      </div>`;
  }

  function quickRepliesMarkup(replies) {
    if (!Array.isArray(replies) || !replies.length) return "";

    return `
      <div class="sb-vb-quick-replies" aria-label="Weitere Vorschl\u00e4ge">
        ${replies.slice(0, 3).map((reply) => (
          `<button class="sb-vb-quick-reply" type="button" data-vb-query="${escapeHtml(reply)}">${escapeHtml(reply)}</button>`
        )).join("")}
      </div>`;
  }

  function scrollChatToEnd(log) {
    log.scrollTop = log.scrollHeight;
  }

  function appendMessage(log, type, content, options = {}) {
    const message = document.createElement("article");
    message.className = `sb-vb-chat-message sb-vb-chat-message-${type}`;

    const label = type === "user" ? "Du" : "Virtual Bastard";
    message.innerHTML = `
      <span class="sb-vb-chat-label">${label}</span>
      <div class="sb-vb-chat-bubble">
        <p>${escapeHtml(content)}</p>
        ${linksMarkup(options.links)}
        ${quickRepliesMarkup(options.quickReplies)}
      </div>
    `;

    log.appendChild(message);
    scrollChatToEnd(log);
  }

  function mascotMarkup(stateName = "idle", bubble = "speak") {
    const bubbleFile = bubble === "think" ? "vb-bubble-think.png" : "vb-bubble-speak.png";
    return `
      <div class="sb-vb-mascot sb-vb-state-${stateName}" aria-hidden="true">
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
        aria-label="Virtual Bastard Assistent \u00f6ffnen"
        aria-expanded="false"
        aria-controls="sb-vb-panel">
        ${mascotMarkup("idle")}
      </button>

      <section class="sb-vb-panel" id="sb-vb-panel" role="dialog"
        aria-labelledby="sb-vb-title" hidden>
        <div class="sb-vb-panel-header">
          <strong class="sb-vb-title" id="sb-vb-title" tabindex="-1">Virtual Bastard</strong>
          <button class="sb-vb-close" type="button" aria-label="Virtual Bastard Assistent schlie\u00dfen">\u00d7</button>
        </div>
        <p class="sb-vb-message">Servus! Ich bin der Virtual Bastard. Wobei kann ich dir helfen?</p>
        <div class="sb-vb-chat-log" aria-live="polite" aria-label="Virtual Bastard Chatverlauf"></div>
        <form class="sb-vb-chat-form">
          <label class="sb-vb-chat-label-hidden" for="sb-vb-chat-input">Nachricht an den Virtual Bastard</label>
          <input class="sb-vb-chat-input" id="sb-vb-chat-input" type="text" autocomplete="off"
            placeholder="Frag mich z. B. nach Mitgliedschaft">
          <button class="sb-vb-chat-submit" type="submit">Senden</button>
        </form>
        <nav class="sb-vb-actions" aria-label="Virtual Bastard Schnellaktionen">
          ${actions.map((item) => `<a class="sb-vb-action" href="${item.href}">${item.label}</a>`).join("")}
        </nav>
      </section>
    `;

    document.body.appendChild(root);
    return root;
  }

  function setMascotState(root, stateName, bubble = "speak") {
    const toggle = root.querySelector(".sb-vb-toggle");
    const currentMascot = toggle.querySelector(".sb-vb-mascot");
    if (!currentMascot) return;

    currentMascot.className = `sb-vb-mascot sb-vb-state-${stateName}`;
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
    const chatLog = root.querySelector(".sb-vb-chat-log");
    const chatForm = root.querySelector(".sb-vb-chat-form");
    const chatInput = root.querySelector(".sb-vb-chat-input");

    loadKnowledge();

    function answerQuery(query) {
      const trimmed = query.trim();
      if (!trimmed) return;

      appendMessage(chatLog, "user", trimmed);

      const match = findAnswer(trimmed);
      if (match) {
        appendMessage(chatLog, "bot", match.answer, {
          links: match.links,
          quickReplies: match.quickReplies
        });
        setMascotState(root, "speak");
        return;
      }

      appendMessage(chatLog, "bot", UNKNOWN_ANSWER, {
        links: [
          { label: "FAQ", href: "/faq.html" },
          { label: "Kontakt", href: "/kontakt.html" }
        ]
      });
      setMascotState(root, "think", "think");
    }

    function openPanel() {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Virtual Bastard Assistent schlie\u00dfen");
      setMascotState(root, "wave");
      window.setTimeout(() => setMascotState(root, "speak"), 750);
      window.setTimeout(() => title.focus({ preventScroll: true }), 0);
      scrollChatToEnd(chatLog);
    }

    function closePanel() {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Virtual Bastard Assistent \u00f6ffnen");
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

    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      answerQuery(chatInput.value);
      chatInput.value = "";
      chatInput.focus({ preventScroll: true });
    });

    chatLog.addEventListener("click", (event) => {
      const quickReply = event.target.closest(".sb-vb-quick-reply");
      if (!quickReply) return;

      answerQuery(quickReply.dataset.vbQuery || quickReply.textContent || "");
      chatInput.focus({ preventScroll: true });
    });

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
