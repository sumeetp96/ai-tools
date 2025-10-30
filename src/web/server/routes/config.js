import express from "express";
import configManager from "../../../core/config.js";
import ProviderFactory from "../../../core/provider-factory.js";

const router = express.Router();

/**
 * GET /api/config
 * Get current configuration
 */
router.get("/", async (req, res) => {
  try {
    const config = await configManager.get();
    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/config
 * Update configuration
 */
router.put("/", async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({ error: "Key is required" });
    }

    await configManager.set(key, value);
    const config = await configManager.get();

    res.json({
      success: true,
      config,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/config/test-provider
 * Test if a provider is available
 */
router.post("/test-provider", async (req, res) => {
  try {
    const { provider, model } = req.body;

    if (!provider) {
      return res.status(400).json({ error: "Provider is required" });
    }

    const config = await configManager.mergeOptions({ provider, model });
    const providerInstance = ProviderFactory.create(config.provider, config);

    const isAvailable = await providerInstance.isAvailable();

    res.json({
      available: isAvailable,
      provider: config.provider,
      model: config.model,
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      error: error.message,
    });
  }
});

export default router;
