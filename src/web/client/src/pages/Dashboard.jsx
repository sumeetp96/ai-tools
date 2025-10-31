import { GitCompare, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import DiffViewer from "../components/DiffViewer";
import InputPanel from "../components/InputPanel";
import OptionsPanel from "../components/OptionsPanel";
import OutputPanel from "../components/OutputPanel";
import { useApp } from "../context/AppContext";
import api from "../services/api";

export default function Dashboard() {
  const { currentTool, addToHistory, addPreset } = useApp();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [options, setOptions] = useState({
    provider: "ollama",
    model: "qwen2.5-coder:14b",
    temperature: 0.2,
    stream: false,
  });
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState(null);
  const [view, setView] = useState("split"); // 'split' or 'diff'
  const [streamController, setStreamController] = useState(null);

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
    if (!input.trim()) {
      alert("Please provide input");
      return;
    }

    setProcessing(true);
    setOutput("");
    setStats(null);

    try {
      if (options.stream) {
        let streamedOutput = "";

        const controller = api.streamTool(currentTool, input, options, {
          onStart: (data) => {
            console.log("Stream started:", data.config);
          },
          onChunk: (text) => {
            streamedOutput += text;
            setOutput(streamedOutput);
          },
          onDone: () => {
            setProcessing(false);
            setStats({
              inputLength: input.length,
              outputLength: streamedOutput.length,
              compressionRatio: (
                (1 - streamedOutput.length / input.length) *
                100
              ).toFixed(1),
            });

            // Add to history
            addToHistory({
              tool: currentTool,
              input,
              output: streamedOutput,
              options,
            });

            setStreamController(null);
          },
          onError: (error) => {
            console.error("Stream error:", error);
            alert(`Error: ${error.message}`);
            setProcessing(false);
            setStreamController(null);
          },
        });

        setStreamController(controller);
      } else {
        const result = await api.executeTool(currentTool, input, options);
        setOutput(result.output);
        setStats(result.stats);
        setProcessing(false);

        // Add to history
        addToHistory({
          tool: currentTool,
          input,
          output: result.output,
          options,
        });
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
      setProcessing(false);
    }
  };

  const handleFileUpload = async (file) => {
    setProcessing(true);

    try {
      const result = await api.uploadFile(currentTool, file, options);

      // Set both input and output
      setInput(result.input);
      setOutput(result.output);
      setStats(result.stats);

      // Add to history
      addToHistory({
        tool: currentTool,
        input: result.input,
        output: result.output,
        options,
      });

      setProcessing(false);
      return result;
    } catch (error) {
      setProcessing(false);
      throw error;
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setView("split")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                view === "split"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setView("diff")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center space-x-1 ${
                view === "diff"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              disabled={!output}
            >
              <GitCompare className="w-4 h-4" />
              <span>Diff View</span>
            </button>
          </div>

          <button
            onClick={processing ? handleCancel : handleExecute}
            disabled={!input.trim() || (processing && !options.stream)}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
              processing && options.stream
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            <Zap className="w-5 h-5" />
            <span>
              {processing
                ? options.stream
                  ? "Cancel"
                  : "Processing..."
                : "Execute"}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {view === "split" ? (
          <>
            {/* Input */}
            <div className="flex-1 p-6 overflow-auto border-r border-gray-200 dark:border-gray-700">
              <InputPanel
                value={input}
                onChange={setInput}
                onFileUpload={handleFileUpload}
              />
            </div>

            {/* Output */}
            <div className="flex-1 p-6 overflow-auto">
              <OutputPanel
                value={output}
                stats={stats}
                streaming={processing}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 p-6 overflow-auto">
            <DiffViewer oldValue={input} newValue={output} />
          </div>
        )}

        {/* Options Sidebar */}
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
