import express from "express";
import configManager from "../../../core/config.js";
import ProviderFactory from "../../../core/provider-factory.js";
import ToolRegistry from "../../../tools/index.js";
import TokenCounter from "../../../core/utils/token-counter.js";
import ContentChunker from "../../../core/utils/content-chunker.js";

const router = express.Router();

// Store active requests for cancellation
const activeRequests = new Map();

/**
 * POST /api/compress-chunked
 * Compress large content with automatic chunking
 */
router.post("/", async (req, res) => {
  const requestId = Date.now().toString();
  const abortController = new AbortController();
  activeRequests.set(requestId, abortController);

  const startTime = Date.now();
  console.log(`\n[${requestId}] 🚀 Starting compression request`);

  try {
    const { input, options = {} } = req.body;

    if (!input) {
      activeRequests.delete(requestId);
      return res.status(400).json({ error: "Input is required" });
    }

    console.log(`[${requestId}] 📊 Input size: ${input.length.toLocaleString()} characters`);

    // Merge config with request options
    const config = await configManager.mergeOptions({
      provider: options.provider,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens || 8000,
    });

    console.log(`[${requestId}] ⚙️  Configuration: ${config.provider} / ${config.model} (temp: ${config.temperature})`);

    // Create provider
    const provider = ProviderFactory.create(config.provider, config);

    console.log(`[${requestId}] 🔌 Checking provider availability...`);
    if (!(await provider.isAvailable())) {
      console.log(`[${requestId}] ❌ Provider ${config.provider} not available`);
      activeRequests.delete(requestId);
      return res.status(503).json({
        error: `Provider ${config.provider} is not available`,
      });
    }
    console.log(`[${requestId}] ✅ Provider ${config.provider} is available`);

    // Check if chunking is needed
    const tokenLimit = config.maxTokens || 8000;
    const estimatedTokens = TokenCounter.estimate(input);
    const needsChunking = TokenCounter.exceedsLimit(input, tokenLimit);

    console.log(`[${requestId}] 🧮 Estimated tokens: ${estimatedTokens.toLocaleString()} (limit: ${tokenLimit.toLocaleString()})`);
    console.log(`[${requestId}] 📦 Chunking needed: ${needsChunking ? 'YES' : 'NO'}`);

    if (!needsChunking) {
      // Process normally without chunking with timeout
      console.log(`[${requestId}] 🔄 Processing single chunk...`);
      const tool = ToolRegistry.create("compress", provider);

      // Set timeout for single chunk processing (5 minutes)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout after 5 minutes")), 5 * 60 * 1000);
      });

      const executionPromise = tool.execute(input, options);
      const result = await Promise.race([executionPromise, timeoutPromise]);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[${requestId}] ✅ Compression complete in ${elapsed}s`);
      console.log(`[${requestId}] 📉 Output size: ${result.length.toLocaleString()} characters`);

      activeRequests.delete(requestId);
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
        requestId,
      });
    }

    // Chunk the content
    console.log(`[${requestId}] ✂️  Chunking content...`);
    const chunks = ContentChunker.chunk(
      input,
      tokenLimit,
      options.chunkStrategy || "smart"
    );
    console.log(`[${requestId}] 📦 Created ${chunks.length} chunks`);

    // Compress each chunk
    const tool = ToolRegistry.create("compress", provider);
    const compressedChunks = [];

    for (const chunk of chunks) {
      const chunkStartTime = Date.now();
      console.log(`\n[${requestId}] 🔄 Processing chunk ${chunk.index + 1}/${chunks.length}...`);
      console.log(`[${requestId}]    Chunk size: ${chunk.content.length.toLocaleString()} characters`);

      // Check if request was cancelled
      if (abortController.signal.aborted) {
        console.log(`[${requestId}] ⛔ Request cancelled by user at chunk ${chunk.index + 1}`);
        throw new Error("Request cancelled by user");
      }

      // Set timeout per chunk (3 minutes per chunk)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Chunk ${chunk.index + 1} timeout after 3 minutes`)), 3 * 60 * 1000);
      });

      const executionPromise = tool.execute(chunk.content, options);

      try {
        const compressed = await Promise.race([executionPromise, timeoutPromise]);
        const chunkElapsed = ((Date.now() - chunkStartTime) / 1000).toFixed(2);
        console.log(`[${requestId}] ✅ Chunk ${chunk.index + 1}/${chunks.length} complete in ${chunkElapsed}s`);
        console.log(`[${requestId}]    Compressed to ${compressed.length.toLocaleString()} characters`);

        compressedChunks.push({
          ...chunk,
          compressed,
        });
      } catch (chunkError) {
        console.error(`[${requestId}] ❌ Error processing chunk ${chunk.index + 1}:`, chunkError);
        throw new Error(`Failed to process chunk ${chunk.index + 1}/${chunks.length}: ${chunkError.message}`);
      }

      // Send progress update via SSE if requested
      if (options.progress) {
        // This would require upgrading to SSE, skipping for now
      }
    }

    // Merge compressed chunks
    console.log(`[${requestId}] 🔗 Merging ${compressedChunks.length} compressed chunks...`);
    const mergedOutput = compressedChunks
      .map((c) => c.compressed)
      .join("\n\n---\n\n");

    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${requestId}] ✅ All chunks complete in ${totalElapsed}s`);
    console.log(`[${requestId}] 📉 Final output: ${mergedOutput.length.toLocaleString()} characters`);
    console.log(`[${requestId}] 🎯 Compression ratio: ${((1 - mergedOutput.length / input.length) * 100).toFixed(1)}%\n`);

    activeRequests.delete(requestId);
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
      requestId,
    });
  } catch (error) {
    activeRequests.delete(requestId);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[${requestId}] ❌ Compression failed after ${elapsed}s:`, error.message);

    // Send appropriate error status
    if (error.message.includes("cancelled")) {
      res.status(499).json({ error: error.message });
    } else if (error.message.includes("timeout")) {
      res.status(408).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * DELETE /api/compress-chunked/:requestId
 * Cancel an ongoing compression request
 */
router.delete("/:requestId", (req, res) => {
  const { requestId } = req.params;
  const abortController = activeRequests.get(requestId);

  if (abortController) {
    console.log(`[${requestId}] 🛑 Cancellation request received`);
    abortController.abort();
    activeRequests.delete(requestId);
    res.json({ message: "Request cancelled successfully" });
  } else {
    console.log(`[${requestId}] ⚠️  Cancellation failed - request not found`);
    res.status(404).json({ error: "Request not found or already completed" });
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
