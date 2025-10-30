/**
 * Base class for all AI tools
 */
class ToolBase {
  constructor(provider) {
    this.provider = provider;
  }

  /**
   * Get tool name
   * @returns {string}
   */
  getName() {
    throw new Error("getName() must be implemented");
  }

  /**
   * Get tool description
   * @returns {string}
   */
  getDescription() {
    throw new Error("getDescription() must be implemented");
  }

  /**
   * Get system prompt for this tool
   * @returns {string}
   */
  getSystemPrompt() {
    throw new Error("getSystemPrompt() must be implemented");
  }

  /**
   * Build user prompt from input
   * @param {string} input - User input
   * @param {Object} options - Additional options
   * @returns {string}
   */
  buildUserPrompt(input, options = {}) {
    throw new Error("buildUserPrompt() must be implemented");
  }

  /**
   * Execute the tool
   * @param {string} input - Input content
   * @param {Object} options - Tool options
   * @returns {Promise<string>}
   */
  async execute(input, options = {}) {
    const messages = [
      {
        role: "system",
        content: this.getSystemPrompt(),
      },
      {
        role: "user",
        content: this.buildUserPrompt(input, options),
      },
    ];

    const result = await this.provider.chat({
      messages,
      stream: options.stream || false,
    });

    return result;
  }

  /**
   * Execute with streaming
   * @param {string} input - Input content
   * @param {Object} options - Tool options
   * @returns {AsyncIterator}
   */
  async executeStream(input, options = {}) {
    return this.execute(input, { ...options, stream: true });
  }
}

export default ToolBase;
