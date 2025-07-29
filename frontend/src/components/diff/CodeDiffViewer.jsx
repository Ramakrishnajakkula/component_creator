import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

// Simple diff algorithm for code comparison
const computeDiff = (oldCode, newCode) => {
  if (!oldCode || !newCode)
    return { additions: [], deletions: [], modifications: [] };

  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");

  const additions = [];
  const deletions = [];
  const modifications = [];

  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex];
    const newLine = newLines[newIndex];

    if (oldIndex >= oldLines.length) {
      // Rest are additions
      additions.push({ line: newIndex + 1, content: newLine });
      newIndex++;
    } else if (newIndex >= newLines.length) {
      // Rest are deletions
      deletions.push({ line: oldIndex + 1, content: oldLine });
      oldIndex++;
    } else if (oldLine === newLine) {
      // Lines are identical
      oldIndex++;
      newIndex++;
    } else {
      // Lines are different - check if it's a modification or addition/deletion
      const nextOldLine = oldLines[oldIndex + 1];
      const nextNewLine = newLines[newIndex + 1];

      if (nextOldLine === newLine) {
        // Deletion
        deletions.push({ line: oldIndex + 1, content: oldLine });
        oldIndex++;
      } else if (nextNewLine === oldLine) {
        // Addition
        additions.push({ line: newIndex + 1, content: newLine });
        newIndex++;
      } else {
        // Modification
        modifications.push({
          line: oldIndex + 1,
          oldContent: oldLine,
          newContent: newLine,
        });
        oldIndex++;
        newIndex++;
      }
    }
  }

  return { additions, deletions, modifications };
};

const CodeDiffViewer = ({ isOpen, onClose }) => {
  const versionHistory = useSelector((state) => state.versionHistory.history);
  const currentVersionIndex = useSelector(
    (state) => state.versionHistory.currentVersion
  );

  const [selectedVersionIndex, setSelectedVersionIndex] = useState(null);
  const [diffType, setDiffType] = useState("jsx"); // 'jsx' or 'css'
  const [diffResult, setDiffResult] = useState(null);

  // Get current and selected versions
  const currentVersion = versionHistory[currentVersionIndex];
  const selectedVersion =
    selectedVersionIndex !== null ? versionHistory[selectedVersionIndex] : null;

  // Compute diff when versions change
  useEffect(() => {
    if (currentVersion && selectedVersion) {
      const oldCode =
        diffType === "jsx" ? selectedVersion.code : selectedVersion.css || "";
      const newCode =
        diffType === "jsx" ? currentVersion.code : currentVersion.css || "";

      const diff = computeDiff(oldCode, newCode);
      setDiffResult(diff);
    } else {
      setDiffResult(null);
    }
  }, [currentVersion, selectedVersion, diffType]);

  // Auto-select previous version when component opens
  useEffect(() => {
    if (isOpen && versionHistory.length > 1 && currentVersionIndex > 0) {
      setSelectedVersionIndex(currentVersionIndex - 1);
    }
  }, [isOpen, versionHistory.length, currentVersionIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">
            Code Diff Viewer
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 p-1">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-700 space-y-4">
          {/* Version Selection */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Compare with version:
              </label>
              <select
                value={selectedVersionIndex || ""}
                onChange={(e) =>
                  setSelectedVersionIndex(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select a version to compare</option>
                {versionHistory.map((version, index) => (
                  <option
                    key={version.id}
                    value={index}
                    disabled={index === currentVersionIndex}>
                    Version {index + 1} - {version.description}
                    {index === currentVersionIndex && " (Current)"}
                  </option>
                ))}
              </select>
            </div>

            {/* File Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                File type:
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setDiffType("jsx")}
                  className={`px-3 py-2 text-sm rounded-md ${
                    diffType === "jsx"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  }`}>
                  JSX
                </button>
                <button
                  onClick={() => setDiffType("css")}
                  className={`px-3 py-2 text-sm rounded-md ${
                    diffType === "css"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  }`}>
                  CSS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Diff Content */}
        <div className="flex-1 overflow-hidden">
          {!selectedVersion ? (
            <div className="flex items-center justify-center h-96 text-gray-400">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-lg">Select a version to compare</p>
                <p className="text-sm">
                  Choose a previous version to see what changed
                </p>
              </div>
            </div>
          ) : !diffResult ? (
            <div className="flex items-center justify-center h-96 text-gray-400">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Computing differences...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 h-96 overflow-hidden">
              {/* Old Version */}
              <div className="border-r border-gray-700">
                <div className="bg-gray-700 p-3 border-b border-gray-600">
                  <h4 className="text-sm font-medium text-gray-200">
                    Version {selectedVersionIndex + 1} -{" "}
                    {selectedVersion.description}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedVersion.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="h-full overflow-auto p-4 bg-gray-900 font-mono text-sm">
                  {(diffType === "jsx"
                    ? selectedVersion.code
                    : selectedVersion.css || ""
                  )
                    .split("\n")
                    .map((line, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          diffResult.deletions.some((d) => d.line === index + 1)
                            ? "bg-red-900/30"
                            : diffResult.modifications.some(
                                (m) => m.line === index + 1
                              )
                            ? "bg-yellow-900/30"
                            : ""
                        }`}>
                        <span className="text-gray-500 w-8 text-right mr-4">
                          {index + 1}
                        </span>
                        <span className="text-gray-100">{line || " "}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* New Version */}
              <div>
                <div className="bg-gray-700 p-3 border-b border-gray-600">
                  <h4 className="text-sm font-medium text-gray-200">
                    Version {currentVersionIndex + 1} -{" "}
                    {currentVersion.description}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {new Date(currentVersion.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="h-full overflow-auto p-4 bg-gray-900 font-mono text-sm">
                  {(diffType === "jsx"
                    ? currentVersion.code
                    : currentVersion.css || ""
                  )
                    .split("\n")
                    .map((line, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          diffResult.additions.some((a) => a.line === index + 1)
                            ? "bg-green-900/30"
                            : diffResult.modifications.some(
                                (m) => m.line === index + 1
                              )
                            ? "bg-yellow-900/30"
                            : ""
                        }`}>
                        <span className="text-gray-500 w-8 text-right mr-4">
                          {index + 1}
                        </span>
                        <span className="text-gray-100">{line || " "}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Diff Summary */}
        {diffResult && (
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span className="text-gray-300">
                  {diffResult.additions.length} additions
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span className="text-gray-300">
                  {diffResult.deletions.length} deletions
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                <span className="text-gray-300">
                  {diffResult.modifications.length} modifications
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeDiffViewer;
