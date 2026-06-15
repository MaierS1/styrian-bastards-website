(() => {
  "use strict";

  const WIDGET_ID = "sb-vb-assistant";
  const ASSET_BASE = "/assets/virtual-bastard/";
  const KNOWLEDGE_URL = "/assets/data/virtual-bastard-knowledge.json";
  const SUPABASE_URL = "https://ekaxdyysefmypkainhij.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU";
  const UNKNOWN_ANSWER = "Das wei\u00df ich leider noch nicht sicher. Vielleicht helfen dir diese Bereiche weiter:";
  const UNKNOWN_LINKS = [
    { label: "FAQ", href: "/faq.html" },
    { label: "Kontakt", href: "/kontakt.html" },
    { label: "Mitglied werden", href: "/mitglied-werden.html" },
    { label: "Events", href: "/index.html#events" }
  ];
  const greetings = [
    "Servus! Ich bin der Virtual Bastard. Wie kann ich dir helfen?",
    "Willkommen bei den Styrian Bastards! Ich bin der Virtual Bastard.",
    "Servus! Hast du Fragen zu unserem Verein, Events oder Fanartikeln?",
    "Ich bin der Virtual Bastard. Frag mich alles rund um die Styrian Bastards."
  ];
  const LIVE_FALLBACKS = {
    events: "Ich kann die Events gerade nicht live laden. Schau bitte auf der Event-Seite nach.",
    sponsors: "Ich kann die Sponsoren gerade nicht live laden. Schau bitte auf der Sponsoren-Seite nach.",
    shop: "Ich kann den Shop gerade nicht live laden. Schau bitte im Bereich Shop & Fanartikel nach.",
    press: "Ich kann die Pressebeitr\u00e4ge gerade nicht live laden. Schau bitte auf der Presse-Seite nach.",
    stats: "Ich kann die Vereinszahlen gerade nicht live laden. Schau bitte sp\u00e4ter wieder vorbei oder nutze die FAQ."
  };
  const LIVE_LINKS = {
    events: [{ label: "Events", href: "/index.html#events" }],
    sponsors: [{ label: "Sponsoren", href: "/sponsoren.html" }],
    shop: [{ label: "Shop & Fanartikel", href: "/merch.html" }],
    press: [{ label: "Presse", href: "/presse.html" }],
    stats: [
      { label: "FAQ", href: "/faq.html" },
      { label: "Kontakt", href: "/kontakt.html" }
    ]
  };

  const navigatorActions = [
    {
      id: "mitglied",
      label: "Mitglied werden",
      href: "/mitglied-werden.html",
      answer: "Du m\u00f6chtest Mitglied werden? Hier geht's direkt zum Antrag.",
      keywords: ["mitglied werden", "mitgliedsantrag", "beitreten", "aufnahme", "ich mochte mitglied", "ich moechte mitglied"]
    },
    {
      id: "events",
      label: "Events anzeigen",
      href: "/index.html#events",
      answer: "Du suchst Events oder Veranstaltungen? Hier findest du die \u00f6ffentlichen Termine.",
      keywords: ["zeig mir events", "events anzeigen", "veranstaltungen anzeigen", "termine anzeigen", "zu den events"]
    },
    {
      id: "shop",
      label: "Shop & Fanartikel",
      href: "/merch.html",
      answer: "Du suchst Fanartikel? Hier geht's direkt zum Shop-Bereich.",
      keywords: ["ich suche fanartikel", "fanartikel suchen", "zum shop", "shop offnen", "shop oeffnen", "merch kaufen"]
    },
    {
      id: "sponsoren",
      label: "Sponsoren",
      href: "/sponsoren.html",
      answer: "Du m\u00f6chtest zu Sponsoren und Partnern? Hier geht's zur Sponsoren-Seite.",
      keywords: ["wer sind eure sponsoren", "zu den sponsoren", "sponsoren anzeigen", "partner anzeigen", "sponsor werden"]
    },
    {
      id: "presse",
      label: "Presse & News",
      href: "/presse.html",
      answer: "Du suchst Presse und News? Hier findest du die \u00f6ffentlichen Beitr\u00e4ge.",
      keywords: ["presse offnen", "presse oeffnen", "news offnen", "news oeffnen", "zu den news", "presse und news"]
    },
    {
      id: "faq",
      label: "FAQ \u00f6ffnen",
      href: "/faq.html",
      answer: "Du hast Fragen? Die FAQ sammelt die wichtigsten Antworten.",
      keywords: ["faq", "fragen", "hilfe", "haeufige fragen", "haufige fragen", "antworten"]
    },
    {
      id: "kontakt",
      label: "Kontakt aufnehmen",
      href: "/kontakt.html",
      answer: "Du m\u00f6chtest uns erreichen? Hier geht's direkt zur Kontaktseite.",
      keywords: ["kontakt", "kontakt aufnehmen", "anschreiben", "erreichen", "frage stellen"]
    },
    {
      id: "mitgliederbereich",
      label: "Mitgliederbereich \u00f6ffnen",
      href: "/mitgliederbereich.html",
      answer: "Du suchst den Mitgliederbereich oder Login? Hier geht's zur gesch\u00fctzten Seite. Ich zeige hier keine pers\u00f6nlichen Daten an.",
      keywords: ["mitgliederbereich", "login", "app", "mitglieder app", "einloggen", "anmelden"]
    }
  ];

  const actions = navigatorActions.map(({ label, href }) => ({ label, href }));

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
    knowledge: fallbackKnowledge,
    context: null
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

  function firstValue(...values) {
    return values.find((value) => value !== null && value !== undefined && value !== "");
  }

  function randomGreeting() {
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  function setContext(context) {
    state.context = context || null;
  }

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(String(value).length === 10 ? `${value}T00:00:00` : value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat("de-AT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function formatCount(value) {
    const count = Number(value);
    return Number.isFinite(count) && count >= 0 ? new Intl.NumberFormat("de-AT").format(count) : null;
  }

  function formatAmount(cents) {
    const value = Number(cents);
    if (!Number.isFinite(value)) return "";

    return new Intl.NumberFormat("de-AT", {
      style: "currency",
      currency: "EUR"
    }).format(value / 100);
  }

  async function fetchPublicRpc(functionName, body = {}) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Supabase RPC ${functionName} failed with status ${response.status}`);
    }

    return response.json();
  }

  function getLiveIntent(query) {
    const text = normalize(query);
    if (!text) return null;

    const hasAny = (words) => words.some((word) => text.includes(word));

    if (hasAny(["nachstes event", "naechstes event", "veranstaltung", "termine", "cornhole", "event"])) {
      return "events";
    }

    if (hasAny(["sponsor", "sponsoren", "partner", "unterstutzer", "unterstuetzer"])) {
      return "sponsors";
    }

    if (hasAny(["shop", "fanartikel", "artikel", "merch"])) {
      return "shop";
    }

    if (hasAny(["news", "presse", "bericht", "neuigkeiten"])) {
      return "press";
    }

    if (hasAny(["wie viele", "zahlen", "mitglieder"])) {
      return "stats";
    }

    return null;
  }

  function getContextualLiveIntent(query) {
    if (!state.context) return null;

    const text = normalize(query);
    if (!text) return null;

    const asksForNext = ["wann", "nachste", "naechste", "termin", "datum"].some((word) => text.includes(word));
    const asksForItems = ["was gibt", "welche", "anzeigen", "zeige", "mehr", "neues", "neu"].some((word) => text.includes(word));

    if (state.context === "events" && (asksForNext || asksForItems)) return "events";
    if (state.context === "shop" && asksForItems) return "shop";
    if (state.context === "sponsoren" && asksForItems) return "sponsors";
    if (state.context === "presse" && (asksForItems || text.includes("bericht"))) return "press";

    return null;
  }

  function getNavigatorAction(query) {
    const text = normalize(query);
    if (!text) return null;

    return navigatorActions.find((action) => (
      action.keywords.some((keyword) => {
        const normalizedKeyword = normalize(keyword);
        return normalizedKeyword && (text.includes(normalizedKeyword) || normalizedKeyword.includes(text));
      })
    )) || null;
  }

  function navigatorAnswer(action) {
    return {
      answer: action.answer,
      links: [{ label: action.label, href: action.href }]
    };
  }

  function contextFromNavigator(action) {
    const contexts = {
      mitglied: "mitgliedschaft",
      events: "events",
      shop: "shop",
      sponsoren: "sponsoren",
      presse: "presse"
    };
    return contexts[action.id] || null;
  }

  function contextFromKnowledge(entry) {
    const contexts = {
      mitgliedschaft: "mitgliedschaft",
      vollmitglied: "mitgliedschaft",
      foerdermitglied: "mitgliedschaft",
      probejahr: "mitgliedschaft",
      mitgliedsbeitraege: "mitgliedschaft",
      events: "events",
      fanfahrten: "events",
      shop: "shop",
      sponsoren: "sponsoren",
      presse: "presse"
    };
    return contexts[entry.id] || null;
  }

  function fallbackLiveAnswer(intent) {
    return {
      answer: LIVE_FALLBACKS[intent] || UNKNOWN_ANSWER,
      links: LIVE_LINKS[intent] || LIVE_LINKS.stats
    };
  }

  function eventDateValue(event) {
    return firstValue(event.starts_at, event.event_date, event.start_at, event.date);
  }

  function eventTitle(event) {
    return firstValue(event.title, event.public_title, event.name, "Event");
  }

  function sortEvents(events) {
    return events.slice().sort((left, right) => {
      const leftDate = new Date(eventDateValue(left) || 0).getTime();
      const rightDate = new Date(eventDateValue(right) || 0).getTime();
      return (Number.isNaN(leftDate) ? 0 : leftDate) - (Number.isNaN(rightDate) ? 0 : rightDate);
    });
  }

  async function getLiveEventsAnswer() {
    const events = await fetchPublicRpc("get_public_events");
    if (!Array.isArray(events)) return fallbackLiveAnswer("events");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextEvent = sortEvents(events)
      .filter((event) => event && eventTitle(event))
      .find((event) => {
        const rawDate = eventDateValue(event);
        if (!rawDate) return true;
        const date = new Date(String(rawDate).length === 10 ? `${rawDate}T00:00:00` : rawDate);
        return Number.isNaN(date.getTime()) || date >= today;
      });

    if (!nextEvent) return fallbackLiveAnswer("events");

    const date = formatDate(eventDateValue(nextEvent));
    const location = firstValue(nextEvent.location, nextEvent.venue, nextEvent.place);
    const dateText = date ? ` am ${date}` : "";
    const locationText = location ? ` in ${location}` : "";

    return {
      answer: `Das n\u00e4chste \u00f6ffentliche Event ist: ${eventTitle(nextEvent)}${dateText}${locationText}. Mehr findest du unter Events.`,
      links: LIVE_LINKS.events
    };
  }

  async function getLiveSponsorsAnswer() {
    const sponsors = await fetchPublicRpc("get_public_sponsors");
    if (!Array.isArray(sponsors) || !sponsors.length) return fallbackLiveAnswer("sponsors");

    const names = sponsors
      .map((sponsor) => String(firstValue(sponsor.name, sponsor.title, sponsor.company_name, "")).trim())
      .filter(Boolean)
      .slice(0, 5);

    if (!names.length) return fallbackLiveAnswer("sponsors");

    return {
      answer: `Aktuell werden folgende Partner \u00f6ffentlich angezeigt: ${names.join(", ")}.`,
      links: LIVE_LINKS.sponsors
    };
  }

  function normalizeMerchItem(item = {}) {
    const basePrice = firstValue(item.display_price_cents, item.base_price_cents, item.price_cents);
    return {
      title: firstValue(item.title, item.public_title, item.name, "Fanartikel"),
      price: formatAmount(basePrice)
    };
  }

  async function getLiveShopAnswer() {
    const merchItems = await fetchPublicRpc("get_public_merch_items");
    if (!Array.isArray(merchItems) || !merchItems.length) return fallbackLiveAnswer("shop");

    const items = merchItems
      .map(normalizeMerchItem)
      .filter((item) => item.title)
      .slice(0, 5)
      .map((item) => item.price ? `${item.title} (${item.price})` : item.title);

    if (!items.length) return fallbackLiveAnswer("shop");

    return {
      answer: `Im Shop sind aktuell folgende Fanartikel sichtbar: ${items.join(", ")}.`,
      links: LIVE_LINKS.shop
    };
  }

  async function getLivePressAnswer() {
    const mediaItems = await fetchPublicRpc("get_public_media_items", {
      p_category: null,
      p_limit: 5,
      p_featured_only: false
    });
    if (!Array.isArray(mediaItems) || !mediaItems.length) return fallbackLiveAnswer("press");

    const items = mediaItems
      .map((item) => {
        const title = String(firstValue(item.title, item.public_title, "")).trim();
        if (!title) return "";
        const date = formatDate(firstValue(item.publication_date, item.published_at, item.date));
        return date ? `${title} (${date})` : title;
      })
      .filter(Boolean)
      .slice(0, 5);

    if (!items.length) return fallbackLiveAnswer("press");

    return {
      answer: `Die neuesten Beitr\u00e4ge sind: ${items.join(", ")}.`,
      links: LIVE_LINKS.press
    };
  }

  async function getLiveStatsAnswer() {
    const result = await fetchPublicRpc("get_public_home_stats");
    const stats = Array.isArray(result) ? result[0] : result;
    if (!stats || typeof stats !== "object") return fallbackLiveAnswer("stats");

    const parts = [
      ["active_members", "Mitglieder"],
      ["upcoming_events", "geplante Events"],
      ["public_sponsors", "Sponsoren"],
      ["public_shop_items", "Fanartikel"]
    ].map(([key, label]) => {
      const count = formatCount(stats[key]);
      return count === null ? "" : `${count} ${label}`;
    }).filter(Boolean);

    if (!parts.length) return fallbackLiveAnswer("stats");

    return {
      answer: `Aktuell zeigt die Homepage: ${parts.join(", ")}.`,
      links: LIVE_LINKS.stats
    };
  }

  async function getLiveAnswer(intent) {
    try {
      if (intent === "events") return await getLiveEventsAnswer();
      if (intent === "sponsors") return await getLiveSponsorsAnswer();
      if (intent === "shop") return await getLiveShopAnswer();
      if (intent === "press") return await getLivePressAnswer();
      if (intent === "stats") return await getLiveStatsAnswer();
    } catch (error) {
      console.warn(`Could not load Virtual Bastard live ${intent} answer`, error);
    }

    return fallbackLiveAnswer(intent);
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
        <p class="sb-vb-message">${randomGreeting()}</p>
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

    async function answerQuery(query) {
      const trimmed = query.trim();
      if (!trimmed) return;

      appendMessage(chatLog, "user", trimmed);

      const navigatorAction = getNavigatorAction(trimmed);
      if (navigatorAction) {
        setContext(contextFromNavigator(navigatorAction));
        const answer = navigatorAnswer(navigatorAction);
        appendMessage(chatLog, "bot", answer.answer, {
          links: answer.links
        });
        setMascotState(root, "success");
        return;
      }

      const liveIntent = getLiveIntent(trimmed) || getContextualLiveIntent(trimmed);
      if (liveIntent) {
        setContext(liveIntent === "sponsors" ? "sponsoren" : liveIntent);
        setMascotState(root, "think", "think");
        const liveAnswer = await getLiveAnswer(liveIntent);
        appendMessage(chatLog, "bot", liveAnswer.answer, {
          links: liveAnswer.links,
          quickReplies: liveAnswer.quickReplies
        });
        setMascotState(root, "success");
        return;
      }

      const match = findAnswer(trimmed);
      if (match) {
        setContext(contextFromKnowledge(match));
        appendMessage(chatLog, "bot", match.answer, {
          links: match.links,
          quickReplies: match.quickReplies
        });
        setMascotState(root, "success");
        return;
      }

      appendMessage(chatLog, "bot", UNKNOWN_ANSWER, {
        links: UNKNOWN_LINKS
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
      setContext(null);
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
