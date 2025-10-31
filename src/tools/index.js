import CompressTool from "./compress.js";
import Html2MdTool from "./html2md.js";

const TOOLS = {
  compress: CompressTool,
  html2md: Html2MdTool,
};

class ToolRegistry {
  /**
   * Create a tool instance
   * @param {string} toolName - Name of the tool
   * @param {AIProvider} provider - AI provider instance
   * @returns {ToolBase} Tool instance
   */
  static create(toolName, provider) {
    const ToolClass = TOOLS[toolName.toLowerCase()];

    if (!ToolClass) {
      throw new Error(
        `Unknown tool: ${toolName}. Available: ${Object.keys(TOOLS).join(", ")}`
      );
    }

    return new ToolClass(provider);
  }

  /**
   * Get list of available tool names
   * @returns {Array<string>}
   */
  static getAvailableTools() {
    return Object.keys(TOOLS);
  }

  /**
   * Check if a tool is supported
   * @param {string} toolName
   * @returns {boolean}
   */
  static isSupported(toolName) {
    return toolName.toLowerCase() in TOOLS;
  }

  /**
   * Get tool descriptions
   * @returns {Object} Map of tool names to descriptions
   */
  static getToolDescriptions() {
    const descriptions = {};

    for (const [name, ToolClass] of Object.entries(TOOLS)) {
      const tool = new ToolClass(null);
      descriptions[name] = tool.getDescription();
    }

    return descriptions;
  }
}

export default ToolRegistry;
