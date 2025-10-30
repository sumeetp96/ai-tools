import path from "path";

const uploadConfig = {
  maxFileSizes: {
    text: 10 * 1024 * 1024, // 10MB
    pdf: 20 * 1024 * 1024, // 20MB
    image: 5 * 1024 * 1024, // 5MB
  },

  allowedFormats: {
    text: [
      ".txt",
      ".md",
      ".markdown",
      ".mdown",
      ".json",
      ".yaml",
      ".yml",
      ".xml",
      ".csv",
      ".tsv",
      ".log",
      ".config",
      ".conf",
      ".ini",
      ".env",
      ".properties",
      ".sql",
      ".sh",
      ".bash",
      ".zsh",
      ".fish",
      ".gitignore",
      ".dockerignore",
      ".editorconfig",
    ],
    code: [
      // JavaScript/TypeScript
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".mjs",
      ".cjs",
      // Web
      ".html",
      ".htm",
      ".css",
      ".scss",
      ".sass",
      ".less",
      ".vue",
      ".svelte",
      ".astro",
      // Python
      ".py",
      ".pyw",
      ".pyx",
      ".pyi",
      // JVM
      ".java",
      ".kt",
      ".kts",
      ".scala",
      ".groovy",
      ".gradle",
      // C/C++
      ".c",
      ".cpp",
      ".cc",
      ".cxx",
      ".h",
      ".hpp",
      ".hxx",
      // C#/.NET
      ".cs",
      ".vb",
      ".fs",
      ".fsx",
      // Systems
      ".rs",
      ".go",
      ".zig",
      // Mobile
      ".swift",
      ".m",
      ".mm",
      ".dart",
      // Scripting
      ".rb",
      ".php",
      ".pl",
      ".lua",
      ".r",
      // Functional
      ".hs",
      ".elm",
      ".ml",
      ".clj",
      ".cljs",
      // Other
      ".proto",
      ".graphql",
      ".sol",
    ],
    document: [".pdf"],
    image: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff"],
  },

  /**
   * Check if file extension is allowed
   */
  isAllowed(filename) {
    const ext = path.extname(filename).toLowerCase();
    return Object.values(this.allowedFormats).flat().includes(ext);
  },

  /**
   * Get file category
   */
  getCategory(filename) {
    const ext = path.extname(filename).toLowerCase();

    for (const [category, extensions] of Object.entries(this.allowedFormats)) {
      if (extensions.includes(ext)) {
        return category;
      }
    }

    return null;
  },

  /**
   * Get max size for file
   */
  getMaxSize(filename) {
    const category = this.getCategory(filename);

    if (!category) return 0;

    return this.maxFileSizes[category === "code" ? "text" : category];
  },
};

export default uploadConfig;
