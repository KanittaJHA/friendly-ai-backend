export const cleanAIResponse = (text) => {
  if (!text) return "";

  return text
    .replace(/(\*\*|###|---)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[-*]\s+/g, "")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\\"/g, '"')
    .trim();
};
