const CLIENT_VERSION = "epic-009-sprint-2";

function createRequestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  return `vb-request-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function buildRequest({ message, sessionId, conversationHistory = [] } = {}) {
  return {
    requestId: createRequestId(),
    clientVersion: CLIENT_VERSION,
    message: String(message || "").trim(),
    sessionId: sessionId || null,
    conversationHistory: Array.isArray(conversationHistory)
      ? conversationHistory
      : [],
    timestamp: new Date().toISOString(),
    locale: globalThis.document?.documentElement?.lang || globalThis.navigator?.language || "de-AT",
    source: "website"
  };
}
