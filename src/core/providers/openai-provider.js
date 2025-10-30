import AIProvider from "../ai-provider.js";

/**
 * OpenAI Provider - Stub for future implementation
 */
class OpenAIProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.model = config.model || "gpt-4-turbo";
    this.temperature = config.temperature ?? 0.2;
    this.maxTokens = config.maxTokens ?? 8192;
  }

  async chat(options) {
    throw new Error("OpenAI provider not yet implemented. Coming soon!");
  }

  async listModels() {
    throw new Error("OpenAI provider not yet implemented. Coming soon!");
  }

  async isAvailable() {
    return !!this.apiKey;
  }

  getName() {
    return "openai";
  }
}

export default OpenAIProvider;
