import ToolBase from "./tool-base.js";

/**
 * HTML to Markdown conversion tool
 * This tool doesn't use AI - it's a pure conversion utility
 */
class Html2MdTool extends ToolBase {
  getName() {
    return "html2md";
  }

  getDescription() {
    return "Convert HTML content to clean Markdown format";
  }

  getSystemPrompt() {
    // Not used since this tool doesn't use AI
    return "";
  }

  buildUserPrompt(input, options = {}) {
    // Not used since this tool doesn't use AI
    return input;
  }

  /**
   * Execute HTML to Markdown conversion (no AI needed)
   * @param {string} input - HTML content
   * @param {Object} options - Conversion options
   * @returns {Promise<string>} Markdown output
   */
  async execute(input, options = {}) {
    // Import dynamically to avoid loading when not needed
    const TurndownService = (await import("turndown")).default;
    const { JSDOM } = await import("jsdom");

    try {
      // Parse HTML with JSDOM
      const dom = new JSDOM(input);
      const document = dom.window.document;

      // Remove unwanted elements
      this.cleanDocument(document);

      // Get cleaned HTML
      const cleanedHtml = document.body.innerHTML;

      // Convert to Markdown
      const turndownService = new TurndownService({
        headingStyle: "atx",
        hr: "---",
        bulletListMarker: "-",
        codeBlockStyle: "fenced",
        emDelimiter: "_",
      });

      // Custom rules for better conversion
      this.addCustomRules(turndownService);

      const markdown = turndownService.turndown(cleanedHtml);

      // Post-process markdown
      return this.postProcess(markdown);
    } catch (error) {
      throw new Error(`HTML to Markdown conversion failed: ${error.message}`);
    }
  }

  /**
   * Remove non-content elements from document
   */
  cleanDocument(document) {
    // Elements to remove
    const selectorsToRemove = [
      "script",
      "style",
      "noscript",
      "iframe",
      "nav",
      "header",
      "footer",
      "aside",
      ".nav",
      ".navigation",
      ".menu",
      ".sidebar",
      ".header",
      ".footer",
      ".advertisement",
      ".ad",
      ".social",
      ".share",
      ".comments",
      ".cookie-notice",
      ".popup",
      ".modal",
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]',
      '[role="complementary"]',
    ];

    selectorsToRemove.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    });

    // Remove elements with display:none or visibility:hidden
    const allElements = document.querySelectorAll("*");
    allElements.forEach((el) => {
      const style = el.getAttribute("style");
      if (style) {
        if (
          style.includes("display:none") ||
          style.includes("display: none") ||
          style.includes("visibility:hidden") ||
          style.includes("visibility: hidden")
        ) {
          el.remove();
        }
      }
    });
  }

  /**
   * Add custom conversion rules
   */
  addCustomRules(turndownService) {
    // Handle code blocks better
    turndownService.addRule("codeBlock", {
      filter: ["pre"],
      replacement: function (content, node) {
        const codeElement = node.querySelector("code");
        if (codeElement) {
          const language =
            codeElement.className.match(/language-(\w+)/)?.[1] || "";
          return `\n\n\`\`\`${language}\n${codeElement.textContent}\n\`\`\`\n\n`;
        }
        return `\n\n\`\`\`\n${node.textContent}\n\`\`\`\n\n`;
      },
    });

    // Better table handling
    turndownService.keep(["table", "thead", "tbody", "tr", "th", "td"]);
  }

  /**
   * Post-process markdown output
   */
  postProcess(markdown) {
    // Remove excessive blank lines (more than 2)
    markdown = markdown.replace(/\n{3,}/g, "\n\n");

    // Remove leading/trailing whitespace
    markdown = markdown.trim();

    // Fix spacing around headings
    markdown = markdown.replace(/\n(#{1,6} )/g, "\n\n$1");

    // Fix spacing after headings
    markdown = markdown.replace(/(#{1,6} .+)\n([^\n])/g, "$1\n\n$2");

    return markdown;
  }

  /**
   * Override executeStream - streaming not supported for this tool
   */
  async executeStream(input, options = {}) {
    throw new Error("Streaming is not supported for HTML to Markdown conversion");
  }
}

export default Html2MdTool;
