import express from "express";
import ToolRegistry from "../../../tools/index.js";

const router = express.Router();

/**
 * POST /api/html2md/convert
 * Convert HTML to Markdown
 */
router.post("/convert", async (req, res) => {
  try {
    const { html, url } = req.body;

    if (!html && !url) {
      return res.status(400).json({ error: "Either html or url is required" });
    }

    let htmlContent = html;

    // If URL is provided, fetch the HTML
    if (url) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        htmlContent = await response.text();
      } catch (error) {
        return res.status(400).json({
          error: `Failed to fetch URL: ${error.message}`,
        });
      }
    }

    if (!htmlContent || !htmlContent.trim()) {
      return res.status(400).json({ error: "No HTML content to process" });
    }

    // Create and execute tool (no AI provider needed for this tool)
    const tool = ToolRegistry.create("html2md", null);
    const markdown = await tool.execute(htmlContent);

    res.json({
      markdown,
      stats: {
        inputLength: htmlContent.length,
        outputLength: markdown.length,
        source: url ? "url" : "html",
        url: url || null,
      },
    });
  } catch (error) {
    console.error("HTML to Markdown conversion error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
