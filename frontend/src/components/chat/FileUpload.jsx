import { useState, useCallback } from "react";
import { validateFile, formatFileSize } from "../../utils/fileUtils";

const FileUpload = ({
  onFileSelect,
  maxFiles = 5,
  maxFileSize = 5 * 1024 * 1024,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const processFiles = useCallback(
    (files) => {
      const fileArray = Array.from(files);
      const validFiles = [];
      const errors = [];

      fileArray.forEach((file) => {
        const validation = validateFile(file, maxFileSize);
        if (validation.isValid) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      });

      if (errors.length > 0) {
        setUploadError(errors.join(", "));
        setTimeout(() => setUploadError(""), 5000);
      }

      if (validFiles.length > 0) {
        onFileSelect(validFiles.slice(0, maxFiles));
      }
    },
    [onFileSelect, maxFiles, maxFileSize]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    // Only set drag over to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleFileInput = useCallback(
    (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        processFiles(files);
      }
      // Reset input value so same file can be selected again
      e.target.value = "";
    },
    [processFiles]
  );

  return (
    <div className="p-4 border-t border-gray-700">
      {/* Error Display */}
      {uploadError && (
        <div className="mb-3 p-2 bg-red-900 border border-red-700 rounded text-sm text-red-300">
          {uploadError}
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}>
        <input
          type="file"
          onChange={handleFileInput}
          accept="image/*"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="pointer-events-none">
          <svg
            className={`mx-auto h-8 w-8 ${
              isDragOver ? "text-blue-400" : "text-gray-400"
            }`}
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48">
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="mt-2">
            <p
              className={`text-sm ${
                isDragOver ? "text-blue-600" : "text-gray-600"
              }`}>
              {isDragOver ? (
                "Drop images here"
              ) : (
                <>
                  <span className="font-medium">Click to upload</span> or drag
                  and drop
                </>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF up to {formatFileSize(maxFileSize)} (max {maxFiles}{" "}
              files)
            </p>
          </div>
        </div>
      </div>

      {/* Upload Tips */}
      <div className="mt-3 text-xs text-gray-500">
        <div className="flex items-start space-x-2">
          <svg
            className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-medium text-gray-700">
              Tips for better results:
            </p>
            <ul className="mt-1 space-y-1 text-gray-600">
              <li>
                • Upload clear screenshots or mockups of the component you want
              </li>
              <li>• Include multiple angles or states if applicable</li>
              <li>• Higher resolution images provide better AI analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
