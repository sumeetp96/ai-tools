import ollama from "ollama";
import AIProvider from "../ai-provider.js";

class OllamaProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    this.model = config.model || "qwen2.5-coder:14b";
    this.temperature = config.temperature ?? 0.2;
    this.maxTokens = config.maxTokens ?? 8192;
  }

  /**
   * Send chat completion request
   */
  async chat(options) {
    const {
      messages,
      stream = false,
      model = this.model,
      temperature = this.temperature,
      maxTokens = this.maxTokens,
    } = options;

    const chatOptions = {
      model,
      messages,
      stream,
      options: {
        temperature,
        num_ctx: maxTokens,
        repeat_penalty: 1.1,
      },
    };

    if (stream) {
      return ollama.chat(chatOptions);
    }

    const response = await ollama.chat(chatOptions);
    return response.message.content;
  }

  /**
   * List available models
   */
  async listModels() {
    try {
      const response = await ollama.list();
      return response.models.map((m) => m.name);
    } catch (error) {
      throw new Error(`Failed to list Ollama models: ${error.message}`);
    }
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable() {
    try {
      await ollama.list();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get provider name
   */
  getName() {
    return "ollama";
  }

  /**
   * Pull a model
   */
  async pullModel(modelName) {
    try {
      const stream = await ollama.pull({ model: modelName, stream: true });
      return stream;
    } catch (error) {
      throw new Error(`Failed to pull model: ${error.message}`);
    }
  }
}

export default OllamaProvider;
