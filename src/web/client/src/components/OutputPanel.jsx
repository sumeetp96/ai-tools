import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";

export default function OutputPanel({ value, stats, streaming }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compressed-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Output</h3>
        {value && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg overflow-auto">
        {streaming && !value && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Generating...</span>
          </div>
        )}
        {value ? (
          <pre className="font-mono text-sm whitespace-pre-wrap break-words">
            {value}
          </pre>
        ) : !streaming ? (
          <p className="text-gray-400 dark:text-gray-500 italic">
            Output will appear here...
          </p>
        ) : null}
      </div>

      {stats && (
        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Characters: {value.length.toLocaleString()}</span>
          {stats.compressionRatio && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              Saved {stats.compressionRatio}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
