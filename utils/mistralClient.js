import axios from "axios";
import { cleanAIResponse } from "./aiHelpers.js";
import { MISTRAL_API_KEY } from "../config/config.js";

const BASE_URL = "https://api.mistral.ai/v1";

if (!MISTRAL_API_KEY) throw new Error("Missing MISTRAL_API_KEY");

// Simple in-memory cache
const cache = new Map();

/* ---------------------- Query LLM ---------------------- */
export const queryLLM = async (prompt, retries = 2) => {
  if (cache.has(prompt)) {
    return cache.get(prompt);
  }

  try {
    const res = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${MISTRAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );
    console.log("Mistral response:", res.data);

    const clean = cleanAIResponse(res.data.choices[0].message.content);

    cache.set(prompt, clean);

    return clean;
  } catch (err) {
    if (retries > 0) {
      console.warn(`Retrying queryLLM... (${retries} left)`);
      return await queryLLM(prompt, retries - 1);
    }
    console.error(
      "Error calling Mistral LLM:",
      err.response?.data || err.message
    );
    return "AI service unavailable";
  }
};

/* ---------------------- Get Embedding ---------------------- */
export const getEmbedding = async (text) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/embeddings`,
      { model: "mistral-embed", input: [text] },
      {
        headers: {
          Authorization: `Bearer ${MISTRAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data.data[0].embedding;
  } catch (err) {
    console.error(
      "Error getting embedding:",
      err.response?.data || err.message
    );
    return null;
  }
};
