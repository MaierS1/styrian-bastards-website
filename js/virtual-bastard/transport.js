export const MODE = "mock";
const AI_ENDPOINT = "https://ekaxdyysefmypkainhij.supabase.co/functions/v1/ai-chat";
const AI_UNAVAILABLE_MESSAGE = "Entschuldige, ich erreiche meine KI gerade nicht zuverlässig. Du kannst mir trotzdem Fragen zu Mitgliedschaft, Events, Shop, Sponsoren oder Kontakt stellen – ich versuche dir mit den vorhandenen Vereinsinfos zu helfen.";

function isDevelopment() {
  const hostname = globalThis.location?.hostname || "";
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
}

function logDevelopment(message, data) {
  if (!isDevelopment()) return;

  console.warn(message, data);
}

function platformRequestBody(request) {
  return {
    message: request.message,
    sessionId: request.sessionId,
    conversationHistory: request.conversationHistory,
    clientVersion: request.clientVersion,
    source: request.source,
    locale: request.locale
  };
}

function normalizePlatformResponse(data, request) {
  const response = data?.response || data || {};
  const selectedTool = normalizeSelectedTool(data?.selectedTool || response.selectedTool || null);

  return {
    success: Boolean(data?.success ?? response.success),
    message: response.message || data?.message || "",
    intent: data?.intent || response.intent || null,
    selectedTool,
    response: {
      success: Boolean(response.success ?? data?.success),
      message: response.message || data?.message || "",
      confidence: response.confidence ?? data?.confidence ?? null,
      followUps: response.followUps || data?.followUps || [],
      suggestedActions: response.suggestedActions || data?.suggestedActions || [],
      tool: response.tool || selectedTool?.toolId || null,
      source: response.source || "platform",
      sources: response.sources || data?.sources || []
    },
    metadata: {
      ...(data?.metadata || {}),
      sessionId: data?.metadata?.sessionId || request.sessionId,
      requestId: request.requestId,
      mocked: false,
      mode: "platform",
      endpoint: AI_ENDPOINT,
      timestamp: new Date().toISOString()
    }
  };
}

function normalizeSelectedTool(selectedTool) {
  if (!selectedTool) return null;

  if (typeof selectedTool === "string") {
    return {
      toolId: selectedTool,
      reason: null
    };
  }

  return {
    ...selectedTool,
    toolId: selectedTool.toolId || selectedTool.id || selectedTool.name || null
  };
}

function mockResponse(request) {
  return {
    success: true,
    intent: "MOCK",
    selectedTool: {
      toolId: null,
      reason: "platform ai client mock"
    },
    response: {
      success: true,
      message: AI_UNAVAILABLE_MESSAGE,
      confidence: 1,
      followUps: ["Mitglied werden", "Nächste Events", "Fanartikel", "Kontakt"],
      suggestedActions: ["Mitglied werden", "Nächste Events", "Fanartikel", "Kontakt"],
      tool: null,
      source: "mock",
      sources: ["mock"]
    },
    metadata: {
      sessionId: request.sessionId,
      requestId: request.requestId,
      request,
      mocked: true,
      mode: "mock",
      timestamp: new Date().toISOString()
    }
  };
}

async function platformResponse(request) {
  try {
    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(platformRequestBody(request))
    });

    if (!response.ok) {
      throw new Error(`Platform AI request failed with status ${response.status}`);
    }

    return normalizePlatformResponse(await response.json(), request);
  } catch (error) {
    logDevelopment("Platform AI unavailable, falling back to mock transport.", error);
    return mockResponse({
      ...request,
      fallbackReason: error instanceof Error ? error.message : "Platform AI unavailable"
    });
  }
}

export async function sendRequest(request, { mode = MODE } = {}) {
  if (mode === "mock") return mockResponse(request);
  if (mode === "platform") return platformResponse(request);

  return mockResponse(request);
}
