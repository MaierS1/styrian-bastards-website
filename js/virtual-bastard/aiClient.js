import { buildRequest } from "./requestBuilder.js";
import { sendRequest } from "./transport.js?v=4.4.1";

export async function sendMessage({ message, sessionId, conversation = [], mode } = {}) {
  const request = buildRequest({
    message,
    sessionId,
    conversationHistory: conversation
  });

  return sendRequest(request, { mode });
}
