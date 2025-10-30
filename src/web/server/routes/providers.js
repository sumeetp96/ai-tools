import express from "express";
import configManager from "../../../core/config.js";
import ProviderFactory from "../../../core/provider-factory.js";

const router = express.Router();

/**
 * GET /api/providers
 * List all available providers
 */
router.get("/", async (req, res) => {
  try {
    const providers = ProviderFactory.getAvailableProviders();
    const config = await configManager.get();

    // Check which providers are actually available
    const availability = {};

    for (const providerName of providers) {
      try {
        const provider = ProviderFactory.create(providerName, {
          model: config.models[providerName],
        });
        availability[providerName] = await provider.isAvailable();
      } catch (error) {
        availability[providerName] = false;
      }
    }

    res.json({
      providers,
      availability,
      default: config.provider,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/providers/:name/models
 * List models for a specific provider
 */
router.get("/:name/models", async (req, res) => {
  try {
    const { name } = req.params;
    const config = await configManager.get();

    const provider = ProviderFactory.create(name, {
      model: config.models[name],
    });

    if (!(await provider.isAvailable())) {
      return res.status(503).json({
        error: `Provider ${name} is not available`,
      });
    }

    const models = await provider.listModels();

    res.json({
      provider: name,
      models,
      default: config.models[name],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
