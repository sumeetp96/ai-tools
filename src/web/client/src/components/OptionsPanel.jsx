import { Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import api from "../services/api";

export default function OptionsPanel({ options, onChange, onSavePreset }) {
  const { presets, deletePreset } = useApp();
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [presetName, setPresetName] = useState("");
  const [showPresetInput, setShowPresetInput] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (options.provider) {
      loadModels(options.provider);
    }
  }, [options.provider]);

  const loadProviders = async () => {
    try {
      const data = await api.getProviders();
      setProviders(data.providers || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load providers:", error);
      setLoading(false);
    }
  };

  const loadModels = async (provider) => {
    try {
      const data = await api.getModels(provider);
      setModels(data.models || []);
    } catch (error) {
      console.error("Failed to load models:", error);
      setModels([]);
    }
  };

  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);
    if (presetId) {
      const preset = presets.find((p) => p.id === presetId);
      if (preset) {
        onChange(preset.options);
      }
    }
  };

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset(presetName, options);
      setPresetName("");
      setShowPresetInput(false);
      setSelectedPreset("");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Options</h3>

      {/* Presets */}
      <div>
        <label className="block text-sm font-medium mb-2">Presets</label>
        <div className="flex space-x-2">
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="flex-1 input-field"
          >
            <option value="">Select a preset...</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          {selectedPreset && (
            <button
              onClick={() => {
                deletePreset(selectedPreset);
                setSelectedPreset("");
              }}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              title="Delete preset"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Provider */}
      <div>
        <label className="block text-sm font-medium mb-2">Provider</label>
        <select
          value={options.provider || ""}
          onChange={(e) => onChange({ ...options, provider: e.target.value })}
          className="input-field"
          disabled={loading}
        >
          {providers.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium mb-2">Model</label>
        <select
          value={options.model || ""}
          onChange={(e) => onChange({ ...options, model: e.target.value })}
          className="input-field"
          disabled={models.length === 0}
        >
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      {/* Temperature */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Temperature: {options.temperature || 0.2}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={options.temperature || 0.2}
          onChange={(e) =>
            onChange({ ...options, temperature: parseFloat(e.target.value) })
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Stream */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={options.stream || false}
            onChange={(e) => onChange({ ...options, stream: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm font-medium">Stream output</span>
        </label>
      </div>

      {/* Save as Preset */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        {showPresetInput ? (
          <div className="space-y-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name..."
              className="input-field"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSavePreset}
                className="flex-1 btn-primary"
                disabled={!presetName.trim()}
              >
                <Save className="w-4 h-4 inline mr-1" />
                Save
              </button>
              <button
                onClick={() => {
                  setShowPresetInput(false);
                  setPresetName("");
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowPresetInput(true)}
            className="w-full btn-secondary"
          >
            <Save className="w-4 h-4 inline mr-1" />
            Save as Preset
          </button>
        )}
      </div>
    </div>
  );
}
