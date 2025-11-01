import express from "express";
import configManager from "../../../core/config.js";
import ProviderFactory from "../../../core/provider-factory.js";
import ToolRegistry from "../../../tools/index.js";
import upload from "../middleware/upload.js";
import fileProcessor from "../services/file-processor.js";

const router = express.Router();

/**
 * GET /api/tools
 * List all available tools
 */
router.get("/", (req, res) => {
  try {
    const tools = ToolRegistry.getToolDescriptions();
    res.json({ tools });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tools/:toolName/execute
 * Execute a tool
 */
router.post("/:toolName/execute", async (req, res) => {
  try {
    const { toolName } = req.params;
    const { input, options = {} } = req.body;

    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    // Merge config with request options
    const config = await configManager.mergeOptions({
      provider: options.provider,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    // Create provider
    const provider = ProviderFactory.create(config.provider, config);

    // Check availability
    if (!(await provider.isAvailable())) {
      return res.status(503).json({
        error: `Provider ${config.provider} is not available`,
      });
    }

    // Create and execute tool
    const tool = ToolRegistry.create(toolName, provider);
    const result = await tool.execute(input, options);

    res.json({
      output: result,
      stats: {
        inputLength: input.length,
        outputLength: result.length,
        compressionRatio: ((1 - result.length / input.length) * 100).toFixed(1),
      },
      config: {
        provider: config.provider,
        model: config.model,
      },
    });
  } catch (error) {
    console.error("Tool execution error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tools/:toolName/upload
 * Upload file and execute tool
 */
router.post("/:toolName/upload", upload.single("file"), async (req, res) => {
  try {
    const { toolName } = req.params;
    const { options = "{}" } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Process file to extract text
    const { text, filename, type, metadata } = await fileProcessor.processFile(
      file
    );

    // Clean up uploaded file
    await fileProcessor.cleanup(file.path);

    // Ensure text is a string
    const textContent = String(text || "");
    if (!textContent.trim()) {
      return res.status(400).json({ error: "No text content found in file" });
    }

    // Parse options
    const parsedOptions = JSON.parse(options);

    // Merge config
    const config = await configManager.mergeOptions({
      provider: parsedOptions.provider,
      model: parsedOptions.model,
      temperature: parsedOptions.temperature,
      maxTokens: parsedOptions.maxTokens,
    });

    // Create provider and tool
    const provider = ProviderFactory.create(config.provider, config);

    if (!(await provider.isAvailable())) {
      return res.status(503).json({
        error: `Provider ${config.provider} is not available`,
      });
    }

    const tool = ToolRegistry.create(toolName, provider);
    const result = await tool.execute(textContent, parsedOptions);

    res.json({
      output: result,
      input: textContent,
      stats: {
        inputLength: textContent.length,
        outputLength: result.length,
        compressionRatio: ((1 - result.length / textContent.length) * 100).toFixed(1),
      },
      file: {
        filename,
        type,
        metadata,
      },
      config: {
        provider: config.provider,
        model: config.model,
      },
    });
  } catch (error) {
    // Clean up file on error
    if (req.file) {
      await fileProcessor.cleanup(req.file.path);
    }
    console.error("File upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tools/:toolName/stream
 * Execute tool with streaming via SSE
 */
router.get("/:toolName/stream", async (req, res) => {
  try {
    const { toolName } = req.params;
    const { input, provider, model } = req.query;

    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Merge config
    const config = await configManager.mergeOptions({ provider, model });

    // Create provider and tool
    const aiProvider = ProviderFactory.create(config.provider, config);

    if (!(await aiProvider.isAvailable())) {
      res.write(
        `data: ${JSON.stringify({ error: "Provider not available" })}\n\n`
      );
      res.end();
      return;
    }

    const tool = ToolRegistry.create(toolName, aiProvider);

    // Send initial metadata
    res.write(
      `data: ${JSON.stringify({
        type: "start",
        config: { provider: config.provider, model: config.model },
      })}\n\n`
    );

    // Execute with streaming
    const stream = await tool.executeStream(input);

    for await (const chunk of stream) {
      const text = chunk.message.content;
      res.write(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`);
    }

    // Send completion
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Streaming error:", error);
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        error: error.message,
      })}\n\n`
    );
    res.end();
  }
});

export default router;
