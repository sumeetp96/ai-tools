import AnthropicProvider from "./providers/anthropic-provider.js";
import OllamaProvider from "./providers/ollama-provider.js";
import OpenAIProvider from "./providers/openai-provider.js";

const PROVIDERS = {
  ollama: OllamaProvider,
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
};

class ProviderFactory {
  /**
   * Create an AI provider instance
   * @param {string} providerName - Name of the provider (ollama, openai, anthropic)
   * @param {Object} config - Provider configuration
   * @returns {AIProvider} Provider instance
   */
  static create(providerName, config = {}) {
    const ProviderClass = PROVIDERS[providerName.toLowerCase()];

    if (!ProviderClass) {
      throw new Error(
        `Unknown provider: ${providerName}. Available: ${Object.keys(
          PROVIDERS
        ).join(", ")}`
      );
    }

    return new ProviderClass(config);
  }

  /**
   * Get list of available provider names
   * @returns {Array<string>}
   */
  static getAvailableProviders() {
    return Object.keys(PROVIDERS);
  }

  /**
   * Check if a provider is supported
   * @param {string} providerName
   * @returns {boolean}
   */
  static isSupported(providerName) {
    return providerName.toLowerCase() in PROVIDERS;
  }
}

export default ProviderFactory;
