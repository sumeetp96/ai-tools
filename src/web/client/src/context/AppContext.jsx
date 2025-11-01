import { createContext, useContext, useEffect, useState } from "react";
import storageService from "../services/storage";

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Initialize theme from storage immediately
  const initialTheme = storageService.getTheme();

  // Apply theme synchronously before rendering
  if (initialTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  const [theme, setTheme] = useState(initialTheme);
  const [currentTool, setCurrentTool] = useState("compress");
  const [history, setHistory] = useState(storageService.getHistory());
  const [presets, setPresets] = useState(storageService.getPresets());

  // Apply theme to document whenever it changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    storageService.setTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const addToHistory = (item) => {
    const newItem = storageService.addHistory(item);
    setHistory(storageService.getHistory());
    return newItem;
  };

  const deleteFromHistory = (id) => {
    storageService.deleteHistory(id);
    setHistory(storageService.getHistory());
  };

  const clearHistory = () => {
    storageService.clearHistory();
    setHistory([]);
  };

  const addPreset = (preset) => {
    const newPreset = storageService.addPreset(preset);
    setPresets(storageService.getPresets());
    return newPreset;
  };

  const deletePreset = (id) => {
    storageService.deletePreset(id);
    setPresets(storageService.getPresets());
  };

  const value = {
    theme,
    toggleTheme,
    currentTool,
    setCurrentTool,
    history,
    addToHistory,
    deleteFromHistory,
    clearHistory,
    presets,
    addPreset,
    deletePreset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
