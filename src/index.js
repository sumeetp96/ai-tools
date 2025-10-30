// Main entry point for programmatic usage
import configManager from "./core/config.js";
import ProviderFactory from "./core/provider-factory.js";
import ToolRegistry from "./tools/index.js";

/**
 * Create and execute a tool
 * @param {string} toolName - Name of the tool to execute
 * @param {string} input - Input content
 * @param {Object} options - Options
 * @returns {Promise<string>} Result
 */
async function execute(toolName, input, options = {}) {
  // Merge config with options
  const config = await configManager.mergeOptions(options);

  // Create provider
  const provider = ProviderFactory.create(config.provider, config);

  // Check availability
  if (!(await provider.isAvailable())) {
    throw new Error(`Provider ${config.provider} is not available`);
  }

  // Create and execute tool
  const tool = ToolRegistry.create(toolName, provider);
  return tool.execute(input, options);
}

/**
 * Execute tool with streaming
 * @param {string} toolName - Name of the tool to execute
 * @param {string} input - Input content
 * @param {Object} options - Options
 * @returns {AsyncIterator} Stream
 */
async function executeStream(toolName, input, options = {}) {
  const config = await configManager.mergeOptions(options);
  const provider = ProviderFactory.create(config.provider, config);

  if (!(await provider.isAvailable())) {
    throw new Error(`Provider ${config.provider} is not available`);
  }

  const tool = ToolRegistry.create(toolName, provider);
  return tool.executeStream(input, options);
}

export { configManager, execute, executeStream, ProviderFactory, ToolRegistry };

export default {
  execute,
  executeStream,
  configManager,
  ProviderFactory,
  ToolRegistry,
};
