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

function normalizeSelectedTool(selectedTool) {
  if (!selectedTool) return null;
  if (typeof selectedTool === "string") return { toolId: selectedTool };

  return {
    ...selectedTool,
    toolId: selectedTool.toolId || selectedTool.id || selectedTool.name || null
  };
}

export function renderResponse(response = {}) {
  const source = response.response || response;
  const suggestions = source.followUps?.length
    ? source.followUps
    : source.suggestedActions || [];
  const selectedTool = normalizeSelectedTool(response.selectedTool || source.selectedTool);

  return {
    message: source.message || "Der Platform-AI-Client ist vorbereitet.",
    debug: {
      intent: source.intent || response.intent || null,
      confidence: typeof source.confidence === "number" ? source.confidence : null,
      tool: source.tool || selectedTool?.toolId || null,
      sources: Array.isArray(source.sources) ? source.sources : []
    },
    quickReplies: suggestions
      .map(normalizeSuggestion)
      .filter((suggestion) => suggestion.label && suggestion.query)
  };
}
