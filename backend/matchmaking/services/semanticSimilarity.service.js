import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use Gemini embedding model
const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004"
});

/**
 * Normalize vector
 */
const normalize = (vec) => {
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map(v => v / magnitude);
};

export const SemanticSimilarityService = {
  /**
   * Generate embedding for input text
   */
  async getEmbedding(text) {
    if (!text || text.trim().length === 0) return null;

    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  },

  /**
   * Cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    const a = normalize(vecA);
    const b = normalize(vecB);

    return a.reduce((sum, v, i) => sum + v * b[i], 0);
  },

  /**
   * Semantic similarity score (0–100)
   */
  async semanticScore(textA, textB) {
    const [embA, embB] = await Promise.all([
      this.getEmbedding(textA),
      this.getEmbedding(textB)
    ]);

    if (!embA || !embB) return 0;

    const cosine = this.cosineSimilarity(embA, embB);

    // Normalize from [-1,1] → [0,100]
    return Math.round(((cosine + 1) / 2) * 100);
  }
};
