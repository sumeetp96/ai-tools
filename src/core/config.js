import fs from "fs/promises";
import { homedir } from "os";
import path from "path";

const CONFIG_FILENAME = ".ai-toolsrc";
const DEFAULT_CONFIG = {
  provider: "ollama",
  models: {
    ollama: "qwen2.5-coder:14b",
    openai: "gpt-4-turbo",
    anthropic: "claude-sonnet-4",
  },
  temperature: 0.2,
  maxTokens: 8192,
};

class ConfigManager {
  constructor() {
    this.config = null;
    this.configPath = null;
  }

  /**
   * Find config file in current directory or home directory
   */
  async findConfigFile() {
    const locations = [
      path.join(process.cwd(), CONFIG_FILENAME),
      path.join(homedir(), CONFIG_FILENAME),
    ];

    for (const location of locations) {
      try {
        await fs.access(location);
        return location;
      } catch {
        // File doesn't exist, continue
      }
    }

    return null;
  }

  /**
   * Load configuration
   */
  async load() {
    if (this.config) return this.config;

    this.configPath = await this.findConfigFile();

    if (this.configPath) {
      try {
        const content = await fs.readFile(this.configPath, "utf-8");
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(content) };
      } catch (error) {
        console.warn(`Warning: Failed to parse config file: ${error.message}`);
        this.config = DEFAULT_CONFIG;
      }
    } else {
      this.config = DEFAULT_CONFIG;
    }

    return this.config;
  }

  /**
   * Get configuration value
   */
  async get(key) {
    const config = await this.load();
    return key ? config[key] : config;
  }

  /**
   * Set configuration value
   */
  async set(key, value) {
    const config = await this.load();
    config[key] = value;

    // Save to home directory if no config exists
    if (!this.configPath) {
      this.configPath = path.join(homedir(), CONFIG_FILENAME);
    }

    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    this.config = config;
  }

  /**
   * Get model for specific provider
   */
  async getModel(provider) {
    const config = await this.load();
    return config.models[provider] || config.models.ollama;
  }

  /**
   * Create default config file
   */
  async createDefault(location = "home") {
    const configPath =
      location === "home"
        ? path.join(homedir(), CONFIG_FILENAME)
        : path.join(process.cwd(), CONFIG_FILENAME);

    await fs.writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return configPath;
  }

  /**
   * Merge CLI options with config
   */
  async mergeOptions(cliOptions = {}) {
    const config = await this.load();

    return {
      provider: cliOptions.provider || config.provider,
      model:
        cliOptions.model ||
        config.models[cliOptions.provider || config.provider],
      temperature: cliOptions.temperature ?? config.temperature,
      maxTokens: cliOptions.maxTokens ?? config.maxTokens,
    };
  }
}

// Singleton instance
const configManager = new ConfigManager();

export default configManager;
export { DEFAULT_CONFIG };
