const STORAGE_KEYS = {
  HISTORY: "ai-tools-history",
  PRESETS: "ai-tools-presets",
  THEME: "ai-tools-theme",
  CONFIG: "ai-tools-config",
};

const MAX_HISTORY = 50;
const MAX_PRESETS = 20;

class StorageService {
  /**
   * Get history
   */
  getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Add history item
   */
  addHistory(item) {
    const history = this.getHistory();
    const newItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...item,
    };

    history.unshift(newItem);

    // Keep only last MAX_HISTORY items
    const trimmed = history.slice(0, MAX_HISTORY);

    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
    return newItem;
  }

  /**
   * Delete history item
   */
  deleteHistory(id) {
    const history = this.getHistory();
    const filtered = history.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
  }

  /**
   * Clear all history
   */
  clearHistory() {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }

  /**
   * Get presets
   */
  getPresets() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Add preset
   */
  addPreset(preset) {
    const presets = this.getPresets();
    const newPreset = {
      id: Date.now().toString(),
      ...preset,
    };

    presets.push(newPreset);

    // Keep only last MAX_PRESETS
    const trimmed = presets.slice(-MAX_PRESETS);

    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(trimmed));
    return newPreset;
  }

  /**
   * Update preset
   */
  updatePreset(id, updates) {
    const presets = this.getPresets();
    const index = presets.findIndex((p) => p.id === id);

    if (index !== -1) {
      presets[index] = { ...presets[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
      return presets[index];
    }

    return null;
  }

  /**
   * Delete preset
   */
  deletePreset(id) {
    const presets = this.getPresets();
    const filtered = presets.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(filtered));
  }

  /**
   * Get theme
   */
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || "light";
  }

  /**
   * Set theme
   */
  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  /**
   * Get local config
   */
  getConfig() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  /**
   * Set local config
   */
  setConfig(config) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }
}

export default new StorageService();
