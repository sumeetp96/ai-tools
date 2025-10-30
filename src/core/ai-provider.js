/**
 * Abstract base class for AI providers
 */
class AIProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Send a chat completion request
   * @param {Object} options - Chat options
   * @param {Array} options.messages - Array of message objects {role, content}
   * @param {boolean} options.stream - Whether to stream the response
   * @returns {Promise<string|AsyncIterator>} Response content or stream
   */
  async chat(options) {
    throw new Error("chat() must be implemented by provider");
  }

  /**
   * List available models
   * @returns {Promise<Array<string>>} Array of model names
   */
  async listModels() {
    throw new Error("listModels() must be implemented by provider");
  }

  /**
   * Check if provider is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    throw new Error("isAvailable() must be implemented by provider");
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    throw new Error("getName() must be implemented by provider");
  }
}

export default AIProvider;
