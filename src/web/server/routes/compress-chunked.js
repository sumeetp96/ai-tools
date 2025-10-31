import express from "express";
import configManager from "../../../core/config.js";
import ProviderFactory from "../../../core/provider-factory.js";
import ToolRegistry from "../../../tools/index.js";
import TokenCounter from "../../../core/utils/token-counter.js";
import ContentChunker from "../../../core/utils/content-chunker.js";

const router = express.Router();

/**
 * POST /api/compress-chunked
 * Compress large content with automatic chunking
 */
router.post("/", async (req, res) => {
  try {
    const { input, options = {} } = req.body;

    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    // Merge config with request options
    const config = await configManager.mergeOptions({
      provider: options.provider,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens || 8000,
    });

    // Create provider
    const provider = ProviderFactory.create(config.provider, config);

    if (!(await provider.isAvailable())) {
      return res.status(503).json({
        error: `Provider ${config.provider} is not available`,
      });
    }

    // Check if chunking is needed
    const tokenLimit = config.maxTokens || 8000;
    const estimatedTokens = TokenCounter.estimate(input);
    const needsChunking = TokenCounter.exceedsLimit(input, tokenLimit);

    if (!needsChunking) {
      // Process normally without chunking
      const tool = ToolRegistry.create("compress", provider);
      const result = await tool.execute(input, options);

      return res.json({
        output: result,
        stats: {
          inputLength: input.length,
          outputLength: result.length,
          compressionRatio: ((1 - result.length / input.length) * 100).toFixed(
            1
          ),
          chunked: false,
          estimatedTokens,
        },
        config: {
          provider: config.provider,
          model: config.model,
        },
      });
    }

    // Chunk the content
    const chunks = ContentChunker.chunk(
      input,
      tokenLimit,
      options.chunkStrategy || "smart"
    );

    // Compress each chunk
    const tool = ToolRegistry.create("compress", provider);
    const compressedChunks = [];

    for (const chunk of chunks) {
      const compressed = await tool.execute(chunk.content, options);
      compressedChunks.push({
        ...chunk,
        compressed,
      });

      // Send progress update via SSE if requested
      if (options.progress) {
        // This would require upgrading to SSE, skipping for now
      }
    }

    // Merge compressed chunks
    const mergedOutput = compressedChunks
      .map((c) => c.compressed)
      .join("\n\n---\n\n");

    res.json({
      output: mergedOutput,
      stats: {
        inputLength: input.length,
        outputLength: mergedOutput.length,
        compressionRatio: ((1 - mergedOutput.length / input.length) * 100).toFixed(
          1
        ),
        chunked: true,
        chunkCount: chunks.length,
        estimatedTokens,
        tokenLimit,
      },
      chunks: compressedChunks.map((c) => ({
        index: c.index,
        total: c.total,
        inputLength: c.content.length,
        outputLength: c.compressed.length,
      })),
      config: {
        provider: config.provider,
        model: config.model,
      },
    });
  } catch (error) {
    console.error("Chunked compression error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/compress-chunked/stream
 * Compress large content with streaming and progress updates
 */
router.post("/stream", async (req, res) => {
  try {
    const { input, options = {} } = req.body;

    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Merge config
    const config = await configManager.mergeOptions({
      provider: options.provider,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens || 8000,
    });

    const provider = ProviderFactory.create(config.provider, config);

    if (!(await provider.isAvailable())) {
      res.write(
        `data: ${JSON.stringify({ type: "error", error: "Provider not available" })}\n\n`
      );
      res.end();
      return;
    }

    const tokenLimit = config.maxTokens || 8000;
    const needsChunking = TokenCounter.exceedsLimit(input, tokenLimit);

    // Send initial status
    res.write(
      `data: ${JSON.stringify({
        type: "start",
        chunked: needsChunking,
        config: { provider: config.provider, model: config.model },
      })}\n\n`
    );

    if (!needsChunking) {
      // Stream without chunking
      const tool = ToolRegistry.create("compress", provider);
      const stream = await tool.executeStream(input, options);

      for await (const chunk of stream) {
        const text = chunk.message.content;
        res.write(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
      return;
    }

    // Chunk and process with progress
    const chunks = ContentChunker.chunk(
      input,
      tokenLimit,
      options.chunkStrategy || "smart"
    );

    res.write(
      `data: ${JSON.stringify({
        type: "chunking",
        chunkCount: chunks.length,
      })}\n\n`
    );

    const tool = ToolRegistry.create("compress", provider);
    const results = [];

    for (const chunk of chunks) {
      res.write(
        `data: ${JSON.stringify({
          type: "progress",
          current: chunk.index + 1,
          total: chunk.total,
        })}\n\n`
      );

      const compressed = await tool.execute(chunk.content, options);
      results.push(compressed);

      res.write(
        `data: ${JSON.stringify({
          type: "chunk-complete",
          index: chunk.index,
          compressed,
        })}\n\n`
      );
    }

    const merged = results.join("\n\n---\n\n");

    res.write(
      `data: ${JSON.stringify({
        type: "done",
        output: merged,
        stats: {
          inputLength: input.length,
          outputLength: merged.length,
          chunkCount: chunks.length,
        },
      })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error("Streaming chunked compression error:", error);
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
