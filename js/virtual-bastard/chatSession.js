function createSessionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  return `vb-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createSession({ sessionId = null } = {}) {
  const timestamp = new Date().toISOString();
  const resolvedSessionId = sessionId || createSessionId();

  return {
    sessionId: resolvedSessionId,
    conversationId: resolvedSessionId,
    createdAt: timestamp,
    updatedAt: timestamp,
    conversationHistory: [],
    currentIntent: null,
    lastTool: null
  };
}

export function addConversationMessage(session, message) {
  if (!session || !message) return session;

  session.conversationHistory.push({
    ...message,
    timestamp: new Date().toISOString()
  });
  session.updatedAt = new Date().toISOString();

  return session;
}

export function updateSessionFromResponse(session, response = {}) {
  if (!session) return session;

  session.currentIntent = response.intent || response.metadata?.intent || session.currentIntent;
  session.lastTool = response.selectedTool?.toolId || response.metadata?.tool || session.lastTool;
  session.updatedAt = new Date().toISOString();

  return session;
}
