import { FileText, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

export default function InputPanel({ value, onChange, onFileUpload }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setUploadedFile(file);

      try {
        const result = await onFileUpload(file);
        onChange(result.input);
      } catch (error) {
        alert(`Upload failed: ${error.message}`);
        setUploadedFile(null);
      } finally {
        setUploading(false);
      }
    },
    [onFileUpload, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: uploading,
  });

  const clearFile = () => {
    setUploadedFile(null);
    onChange("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Input</h3>
        {uploadedFile && (
          <button
            onClick={clearFile}
            className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {uploadedFile ? (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center space-x-3">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
              {uploadedFile.name}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {(uploadedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`mb-3 p-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {uploading ? (
                "Uploading..."
              ) : isDragActive ? (
                "Drop file here"
              ) : (
                <>
                  Drop file here or click to upload
                  <span className="block text-xs mt-1">
                    Supports text, code, PDF, and images
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your content here or upload a file..."
        className="flex-1 w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
      />

      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
        Characters: {value.length.toLocaleString()}
      </div>
    </div>
  );
}
