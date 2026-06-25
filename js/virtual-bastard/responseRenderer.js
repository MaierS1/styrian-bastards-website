function normalizeSuggestion(suggestion) {
  if (typeof suggestion === "string") {
    return {
      label: suggestion,
      query: suggestion,
      action: "",
      prompt: suggestion,
      type: "",
      value: suggestion
    };
  }

  const label = suggestion?.label || suggestion?.title || suggestion?.query || suggestion?.prompt || suggestion?.value || "";
  const prompt = suggestion?.prompt || suggestion?.query || suggestion?.value || label;

  return {
    label,
    query: suggestion?.query || prompt,
    action: suggestion?.action || "",
    prompt,
    type: suggestion?.type || "",
    value: suggestion?.value || prompt
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
