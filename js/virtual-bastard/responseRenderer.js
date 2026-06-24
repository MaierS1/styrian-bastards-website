function normalizeSuggestion(suggestion) {
  if (typeof suggestion === "string") {
    return {
      label: suggestion,
      query: suggestion
    };
  }

  return {
    label: suggestion?.label || suggestion?.title || suggestion?.query || "",
    query: suggestion?.query || suggestion?.label || suggestion?.title || ""
  };
}

export function renderResponse(response = {}) {
  const source = response.response || response;
  const suggestions = source.followUps?.length
    ? source.followUps
    : source.suggestedActions || [];
  const selectedTool = response.selectedTool || source.selectedTool;
  const intent = source.intent || response.intent;
  const tool = source.tool || selectedTool?.toolId;
  const details = [
    intent ? `Intent: ${intent}` : null,
    typeof source.confidence === "number" ? `Confidence: ${source.confidence}` : null,
    tool ? `Tool: ${tool}` : null,
    Array.isArray(source.sources) && source.sources.length ? `Sources: ${source.sources.join(", ")}` : null
  ].filter(Boolean);

  return {
    message: [
      source.message || "Der Platform-AI-Client ist vorbereitet.",
      ...details
    ].join("\n"),
    quickReplies: suggestions
      .map(normalizeSuggestion)
      .filter((suggestion) => suggestion.label && suggestion.query)
  };
}
