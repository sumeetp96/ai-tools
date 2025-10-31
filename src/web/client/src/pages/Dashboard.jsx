import { Globe, FileText, Upload, Zap, Copy, Download, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import OutputPanel from "../components/OutputPanel";
import OptionsPanel from "../components/OptionsPanel";
import { useApp } from "../context/AppContext";
import api from "../services/api";

export default function Dashboard() {
  const { currentTool, addToHistory, addPreset } = useApp();
  const [inputType, setInputType] = useState("text"); // 'text', 'url', 'file'
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const [intermediateMarkdown, setIntermediateMarkdown] = useState("");
  const [output, setOutput] = useState("");
  const [options, setOptions] = useState({
    provider: "ollama",
    model: "qwen2.5-coder:14b",
    temperature: 0.2,
    stream: false,
  });
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState(null);
  const [streamController, setStreamController] = useState(null);
  const [error, setError] = useState(null);
  const [chunkingProgress, setChunkingProgress] = useState(null);

  // Load default config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { config } = await api.getConfig();
      setOptions((prev) => ({
        ...prev,
        provider: config.provider,
        model: config.models[config.provider],
        temperature: config.temperature,
      }));
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  };

  const handleExecute = async () => {
    // Validate inputs
    if (inputType === "text" && !textInput.trim()) {
      setError("Please provide text input");
      return;
    }
    if (inputType === "url" && !urlInput.trim()) {
      setError("Please provide a URL");
      return;
    }
    if (inputType === "file" && !fileInput) {
      setError("Please upload a file");
      return;
    }

    setProcessing(true);
    setOutput("");
    setStats(null);
    setError(null);
    setIntermediateMarkdown("");
    setChunkingProgress(null);

    try {
      let finalInput = textInput;

      // Handle URL input - convert to markdown first
      if (inputType === "url") {
        try {
          const response = await fetch("http://localhost:3842/api/html2md/convert", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: urlInput }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch URL");
          }

          const data = await response.json();
          finalInput = data.markdown;
          setIntermediateMarkdown(finalInput); // Show the intermediate markdown
        } catch (err) {
          setError(`URL conversion failed: ${err.message}`);
          setProcessing(false);
          return;
        }
      }

      // Handle file input
      if (inputType === "file") {
        const result = await api.uploadFile(currentTool, fileInput, options);
        finalInput = result.input;
        setTextInput(finalInput); // Update text input with file content
        setOutput(result.output);
        setStats(result.stats);
        setProcessing(false);

        // Add to history
        addToHistory({
          tool: currentTool,
          input: finalInput,
          output: result.output,
          options,
        });
        return;
      }

      // Use chunked compression API for better handling of large content
      const response = await fetch("http://localhost:3842/api/compress-chunked", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: finalInput,
          options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Compression failed");
      }

      const result = await response.json();
      setOutput(result.output);
      setStats(result.stats);
      setProcessing(false);

      // Show chunking info if content was chunked
      if (result.stats.chunked) {
        setChunkingProgress({
          chunked: true,
          chunkCount: result.stats.chunkCount,
          estimatedTokens: result.stats.estimatedTokens,
          tokenLimit: result.stats.tokenLimit,
        });
      }

      // Add to history
      addToHistory({
        tool: currentTool,
        input: finalInput,
        output: result.output,
        options,
      });
    } catch (error) {
      setError(`Error: ${error.message}`);
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    if (streamController) {
      streamController.close();
      setStreamController(null);
      setProcessing(false);
    }
  };

  const handleSavePreset = (name, opts) => {
    addPreset({
      name,
      tool: currentTool,
      options: opts,
    });
  };

  const handleCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      alert("Copied to clipboard!");
    } catch (err) {
      alert("Failed to copy to clipboard");
    }
  };

  const handleDownloadOutput = () => {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compressed-output.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // File dropzone
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setFileInput(file);
    setInputType("file");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const clearFile = () => {
    setFileInput(null);
    setTextInput("");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Compress Documentation
          </h1>
          <div className="flex items-center space-x-3">
            {output && (
              <>
                <button
                  onClick={handleCopyOutput}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleDownloadOutput}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </>
            )}
            <button
              onClick={processing ? handleCancel : handleExecute}
              disabled={processing && !options.stream}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                processing && options.stream
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{options.stream ? "Cancel" : "Processing..."}</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Compress</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input */}
        <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
          {/* Input Type Tabs */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setInputType("text")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputType === "text"
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Text</span>
              </button>
              <button
                onClick={() => setInputType("url")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputType === "url"
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>URL</span>
              </button>
              <button
                onClick={() => setInputType("file")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputType === "file"
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>File</span>
              </button>
            </div>
          </div>

          {/* Input Content */}
          <div className="flex-1 p-6 overflow-auto">
            {inputType === "text" && (
              <div className="h-full flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text Input
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your documentation or text here..."
                  className="flex-1 w-full p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Characters: {textInput.length.toLocaleString()}
                </div>
              </div>
            )}

            {inputType === "url" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/documentation"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Enter the URL of a documentation page or article. The HTML will be converted to Markdown before compression.
                  </p>
                </div>

                {intermediateMarkdown && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Converted Markdown (Preview)
                      </label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {intermediateMarkdown.length.toLocaleString()} chars
                      </span>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg max-h-96 overflow-auto">
                      <pre className="font-mono text-xs whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                        {intermediateMarkdown}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {inputType === "file" && (
              <div className="space-y-4">
                {fileInput ? (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-100">
                            {fileInput.name}
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            {(fileInput.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={clearFile}
                        className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <X className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={`p-12 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                      isDragActive
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center space-y-4">
                      <Upload className="w-16 h-16 text-gray-400" />
                      <div className="text-center">
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                          {isDragActive ? "Drop file here" : "Drop file here or click to upload"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Supports text, code, PDF, and images
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {textInput && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      File Content Preview
                    </label>
                    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg max-h-96 overflow-auto">
                      <pre className="font-mono text-xs whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                        {textInput}
                      </pre>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Characters: {textInput.length.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            {chunkingProgress && chunkingProgress.chunked && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Large Content Detected
                    </h4>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <p>Content was split into <strong>{chunkingProgress.chunkCount} chunks</strong> for processing.</p>
                      <p className="text-xs">
                        Estimated: {chunkingProgress.estimatedTokens.toLocaleString()} tokens
                        (limit: {chunkingProgress.tokenLimit.toLocaleString()} tokens)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel - Output */}
        <div className="flex-1 p-6 overflow-auto bg-white dark:bg-gray-800">
          <OutputPanel
            value={output}
            stats={stats}
            streaming={processing}
          />
        </div>

        {/* Right Panel - Options */}
        <div className="w-80 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-6 overflow-auto">
          <OptionsPanel
            options={options}
            onChange={setOptions}
            onSavePreset={handleSavePreset}
          />
        </div>
      </div>
    </div>
  );
}
