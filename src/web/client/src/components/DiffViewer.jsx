import ReactDiffViewer from "react-diff-viewer-continued";
import { useApp } from "../context/AppContext";

export default function DiffViewer({ oldValue, newValue }) {
  const { theme } = useApp();

  if (!oldValue || !newValue) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Process content to see differences
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <ReactDiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView={true}
        useDarkTheme={theme === "dark"}
        leftTitle="Original"
        rightTitle="Compressed"
        styles={{
          variables: {
            dark: {
              diffViewerBackground: "#1f2937",
              diffViewerColor: "#f3f4f6",
              addedBackground: "#064e3b",
              addedColor: "#d1fae5",
              removedBackground: "#7f1d1d",
              removedColor: "#fecaca",
              wordAddedBackground: "#065f46",
              wordRemovedBackground: "#991b1b",
              addedGutterBackground: "#064e3b",
              removedGutterBackground: "#7f1d1d",
              gutterBackground: "#374151",
              gutterBackgroundDark: "#1f2937",
              highlightBackground: "#374151",
              highlightGutterBackground: "#4b5563",
            },
            light: {
              diffViewerBackground: "#ffffff",
              diffViewerColor: "#1f2937",
              addedBackground: "#d1fae5",
              addedColor: "#064e3b",
              removedBackground: "#fecaca",
              removedColor: "#7f1d1d",
              wordAddedBackground: "#a7f3d0",
              wordRemovedBackground: "#fca5a5",
              addedGutterBackground: "#d1fae5",
              removedGutterBackground: "#fecaca",
              gutterBackground: "#f3f4f6",
              gutterBackgroundDark: "#e5e7eb",
              highlightBackground: "#fef3c7",
              highlightGutterBackground: "#fde68a",
            },
          },
        }}
      />
    </div>
  );
}
