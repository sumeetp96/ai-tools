/**
 * Token counter utility
 * Uses approximate token counting (1 token ≈ 4 characters for English text)
 * This is a rough estimate - actual tokens depend on the model's tokenizer
 */

class TokenCounter {
  /**
   * Estimate tokens in text
   * @param {string} text
   * @returns {number} Estimated token count
   */
  static estimate(text) {
    if (!text) return 0;

    // Rough estimation: 1 token ≈ 4 characters
    // Adjust for different content types
    const charCount = text.length;

    // More accurate for code and technical content
    // Code tends to have more tokens per character due to special characters
    const hasCode = text.includes('```') || text.includes('function') || text.includes('const ');
    const multiplier = hasCode ? 0.3 : 0.25; // tokens per character

    return Math.ceil(charCount * multiplier);
  }

  /**
   * Check if text exceeds token limit
   * @param {string} text
   * @param {number} limit
   * @returns {boolean}
   */
  static exceedsLimit(text, limit = 8000) {
    return this.estimate(text) > limit;
  }

  /**
   * Get recommended chunk size for a given limit
   * @param {number} tokenLimit
   * @returns {number} Character count for chunk
   */
  static getChunkSize(tokenLimit = 8000) {
    // Leave some room for system prompt and overhead
    const safeLimit = tokenLimit * 0.8;
    // Convert tokens back to approximate characters
    return Math.floor(safeLimit / 0.25);
  }
}

export default TokenCounter;
