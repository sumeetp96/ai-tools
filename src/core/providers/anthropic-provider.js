import AIProvider from "../ai-provider.js";

/**
 * Anthropic Provider - Stub for future implementation
 */
class AnthropicProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = config.model || "claude-sonnet-4";
    this.temperature = config.temperature ?? 0.2;
    this.maxTokens = config.maxTokens ?? 8192;
  }

  async chat(options) {
    throw new Error("Anthropic provider not yet implemented. Coming soon!");
  }

  async listModels() {
    throw new Error("Anthropic provider not yet implemented. Coming soon!");
  }

  async isAvailable() {
    return !!this.apiKey;
  }

  getName() {
    return "anthropic";
  }
}

export default AnthropicProvider;
