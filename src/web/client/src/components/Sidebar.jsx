import { FileText, History, FileCode } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

const TOOLS = [
  { id: "compress", name: "Compress Docs", icon: FileText, path: "/" },
  { id: "html2md", name: "HTML to Markdown", icon: FileCode, path: "/html2md" },
];

export default function Sidebar() {
  const { currentTool, setCurrentTool } = useApp();
  const location = useLocation();

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Tools
          </h3>
          <div className="space-y-1">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isActive = location.pathname === tool.path;

              return (
                <Link
                  key={tool.id}
                  to={tool.path}
                  onClick={() => setCurrentTool(tool.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tool.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Quick Access
          </h3>
          <div className="space-y-1">
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
              <History className="w-5 h-5" />
              <span className="font-medium">History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
