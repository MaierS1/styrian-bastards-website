import { buildRequest } from "./requestBuilder.js";
import { sendRequest } from "./transport.js";

export async function sendMessage({ message, sessionId, conversation = [], mode } = {}) {
  const request = buildRequest({
    message,
    sessionId,
    conversationHistory: conversation
  });

  return sendRequest(request, { mode });
}
