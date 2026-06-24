export const MODE = "mock";

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
      message: `Mock Response: "${request.message}" wurde fuer den Platform-AI-Client vorbereitet.`,
      confidence: 1,
      followUps: ["Events", "Mitgliedschaft", "Shop"],
      suggestedActions: ["Events", "Mitgliedschaft", "Shop"],
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

function platformResponse() {
  return {
    success: false,
    intent: "UNAVAILABLE",
    selectedTool: {
      toolId: null,
      reason: "platform transport not configured"
    },
    response: {
      success: false,
      message: "Der Platform-AI-Transport ist vorbereitet, aber noch nicht angebunden.",
      confidence: 0,
      followUps: [],
      suggestedActions: [],
      tool: null,
      source: "platform",
      sources: ["platform"]
    },
    metadata: {
      mocked: false,
      mode: "platform",
      transportReady: false,
      timestamp: new Date().toISOString()
    }
  };
}

export async function sendRequest(request, { mode = MODE } = {}) {
  if (mode === "mock") return mockResponse(request);
  if (mode === "platform") return platformResponse();

  return mockResponse(request);
}
