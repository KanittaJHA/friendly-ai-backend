import KnowledgeBase from "../models/KnowledgeBase.js";
import { getEmbedding } from "../utils/mistralClient.js";

// ---------------------- Cosine Similarity ----------------------
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return dot / (normA * normB);
}

// ---------------------- Find Relevant Docs ----------------------
export const findRelevantDocs = async (query, topK = 5) => {
  const queryEmbedding = await getEmbedding(query);
  if (!queryEmbedding) return [];

  const allDocs = await KnowledgeBase.find(
    {},
    { title: 1, content: 1, embedding: 1 }
  );

  const scored = allDocs.map((doc) => ({
    ...doc._doc,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
};
