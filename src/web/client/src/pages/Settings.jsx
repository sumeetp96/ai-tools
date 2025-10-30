import { AlertCircle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Settings() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [configData, providersData] = await Promise.all([
        api.getConfig(),
        api.getProviders(),
      ]);

      setConfig(configData.config);
      setProviders(providersData.providers || []);
      setLoading(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: `Failed to load settings: ${error.message}`,
      });
      setLoading(false);
    }
  };

  const handleSave = async (key, value) => {
    setSaving(true);

    try {
      await api.updateConfig(key, value);
      setMessage({ type: "success", text: "Settings saved successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: `Failed to save: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (provider) => {
    try {
      const result = await api.testProvider(provider, config.models[provider]);
      setMessage({
        type: result.available ? "success" : "error",
        text: result.available
          ? `${provider} is available`
          : `${provider} is not available`,
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="space-y-8">
          {/* Default Provider */}
          <section className="panel">
            <h2 className="text-xl font-semibold mb-4">Default Provider</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Provider
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => {
                    const newConfig = { ...config, provider: e.target.value };
                    setConfig(newConfig);
                    handleSave("provider", e.target.value);
                  }}
                  className="input-field"
                  disabled={saving}
                >
                  {providers.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => testProvider(config.provider)}
                className="btn-secondary"
              >
                Test Connection
              </button>
            </div>
          </section>

          {/* Models Configuration */}
          <section className="panel">
            <h2 className="text-xl font-semibold mb-4">Default Models</h2>
            <div className="space-y-4">
              {providers.map((provider) => (
                <div key={provider}>
                  <label className="block text-sm font-medium mb-2 capitalize">
                    {provider}
                  </label>
                  <input
                    type="text"
                    value={config.models[provider] || ""}
                    onChange={(e) => {
                      const newModels = {
                        ...config.models,
                        [provider]: e.target.value,
                      };
                      setConfig({ ...config, models: newModels });
                    }}
                    onBlur={(e) => {
                      handleSave("models", {
                        ...config.models,
                        [provider]: e.target.value,
                      });
                    }}
                    className="input-field"
                    placeholder={`Enter ${provider} model name`}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Generation Settings */}
          <section className="panel">
            <h2 className="text-xl font-semibold mb-4">Generation Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Temperature: {config.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setConfig({ ...config, temperature: value });
                  }}
                  onMouseUp={(e) => {
                    handleSave("temperature", parseFloat(e.target.value));
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Precise (0)</span>
                  <span>Balanced (0.5)</span>
                  <span>Creative (1)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setConfig({ ...config, maxTokens: value });
                  }}
                  onBlur={(e) => {
                    handleSave("maxTokens", parseInt(e.target.value));
                  }}
                  className="input-field"
                  min="1024"
                  max="32768"
                  step="1024"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
