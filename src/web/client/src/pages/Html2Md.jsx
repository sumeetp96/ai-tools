import { FileCode, Globe, Loader2, Copy, Download } from "lucide-react";
import { useState } from "react";

export default function Html2Md() {
  const [inputType, setInputType] = useState("url"); // 'url' or 'html'
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const handleConvert = async () => {
    if (inputType === "url" && !url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (inputType === "html" && !html.trim()) {
      setError("Please enter HTML content");
      return;
    }

    setProcessing(true);
    setError(null);
    setMarkdown("");
    setStats(null);

    try {
      const response = await fetch("http://localhost:3842/api/html2md/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: inputType === "url" ? url : null,
          html: inputType === "html" ? html : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Conversion failed");
      }

      const data = await response.json();
      setMarkdown(data.markdown);
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      alert("Copied to clipboard!");
    } catch (err) {
      alert("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setInputType("url")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center space-x-1 ${
                inputType === "url"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>URL</span>
            </button>
            <button
              onClick={() => setInputType("html")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center space-x-1 ${
                inputType === "html"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>HTML</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {markdown && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </>
            )}
            <button
              onClick={handleConvert}
              disabled={processing}
              className="flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <FileCode className="w-5 h-5" />
                  <span>Convert</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Input */}
        <div className="flex-1 p-6 overflow-auto border-r border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Input</h2>

            {inputType === "url" ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter the URL of an article, documentation, or any web page to
                  convert to Markdown
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  HTML Content
                </label>
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="<html>...</html>"
                  rows={20}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm dark:bg-gray-800"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Paste raw HTML markup to convert to Markdown
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            {stats && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Source:
                  </span>
                  <span className="font-medium">
                    {stats.source === "url" ? `URL (${stats.url})` : "HTML"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Input size:
                  </span>
                  <span className="font-medium">
                    {stats.inputLength.toLocaleString()} chars
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Output size:
                  </span>
                  <span className="font-medium">
                    {stats.outputLength.toLocaleString()} chars
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Markdown Output</h2>

            {markdown ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg font-mono text-sm whitespace-pre-wrap break-words">
                  {markdown}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-600">
                <div className="text-center space-y-2">
                  <FileCode className="w-12 h-12 mx-auto opacity-50" />
                  <p>Converted markdown will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
