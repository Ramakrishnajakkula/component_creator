import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  copyToClipboard,
  createComponentZip,
  downloadBlob,
  generateComponentFile,
  extractDependencies,
} from "../../utils/exportUtils";
import {
  addLocalExport,
  saveExportHistory,
  loadExportHistory,
  selectExportHistory,
  selectExportStats,
} from "../../store/slices/exportSlice";

const ExportPanel = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { code, css } = useSelector((state) => state.editor);
  const { currentSession } = useSelector((state) => state.sessions);
  const exportHistory = useSelector(selectExportHistory);
  const exportStats = useSelector(selectExportStats);

  const [exportStatus, setExportStatus] = useState("");
  const [componentName, setComponentName] = useState(
    currentSession?.name || "MyComponent"
  );
  const [includeCSS, setIncludeCSS] = useState(!!css);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("export");

  // Load export history when panel opens
  useEffect(() => {
    if (isOpen && currentSession?.id) {
      dispatch(loadExportHistory(currentSession.id));
    }
  }, [isOpen, currentSession?.id, dispatch]);

  const trackExport = async (format, details = {}) => {
    const exportData = {
      id: Date.now(),
      sessionId: currentSession?.id,
      componentName,
      format,
      includeCSS,
      codeSize: code?.length || 0,
      cssSize: css?.length || 0,
      ...details,
    };

    dispatch(addLocalExport(exportData));

    if (currentSession?.id) {
      try {
        await dispatch(
          saveExportHistory({
            sessionId: currentSession.id,
            exportData,
          })
        );
      } catch (error) {
        console.error("Failed to save export history:", error);
      }
    }
  };

  const handleCopyCode = async () => {
    try {
      setExportStatus("");
      setIsExporting(true);

      const { componentCode } = generateComponentFile(
        componentName,
        code,
        includeCSS ? css : ""
      );
      const result = await copyToClipboard(componentCode);

      if (result.success) {
        setExportStatus("✅ Component code copied to clipboard!");
        await trackExport("clipboard", { type: "component" });
      } else {
        setExportStatus("❌ Failed to copy to clipboard");
      }
    } catch (error) {
      setExportStatus("❌ Error copying code");
      console.error("Copy error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyCSS = async () => {
    try {
      setExportStatus("");
      setIsExporting(true);

      if (!css) {
        setExportStatus("⚠️ No CSS code to copy");
        return;
      }

      const result = await copyToClipboard(css);

      if (result.success) {
        setExportStatus("✅ CSS copied to clipboard!");
        await trackExport("clipboard", { type: "css" });
      } else {
        setExportStatus("❌ Failed to copy CSS");
      }
    } catch (error) {
      setExportStatus("❌ Error copying CSS");
      console.error("Copy CSS error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      setExportStatus("📦 Creating ZIP file...");

      const dependencies = extractDependencies(code, css);
      const description =
        currentSession?.description || "Generated React component";

      const zipBlob = await createComponentZip({
        componentName,
        code,
        css: includeCSS ? css : "",
        dependencies,
        description,
      });

      downloadBlob(zipBlob, `${componentName}.zip`);
      setExportStatus("✅ ZIP file downloaded successfully!");
      await trackExport("zip", { dependencies: dependencies.length });
    } catch (error) {
      setExportStatus("❌ Error creating ZIP file");
      console.error("ZIP creation error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const resetStatus = () => {
    setTimeout(() => setExportStatus(""), 3000);
  };

  useEffect(() => {
    if (exportStatus) {
      resetStatus();
    }
  }, [exportStatus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">
            Export Component
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

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("export")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "export"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-200"
            }`}>
            Export
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "history"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-200"
            }`}>
            History ({exportHistory.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {activeTab === "export" ? (
            <div className="p-6 space-y-4">
              {/* Component Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Component Name
                </label>
                <input
                  type="text"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="MyComponent"
                />
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeCSS}
                    onChange={(e) => setIncludeCSS(e.target.checked)}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    disabled={!css}
                  />
                  <span className="ml-2 text-sm text-gray-300">
                    Include CSS file {!css && "(No CSS available)"}
                  </span>
                </label>
              </div>

              {/* Export Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleCopyCode}
                  disabled={isExporting || !code}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                  <svg
                    className="w-4 h-4 mr-2"
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
                  Copy Component Code
                </button>

                {css && (
                  <button
                    onClick={handleCopyCSS}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    Copy CSS Code
                  </button>
                )}

                <button
                  onClick={handleDownloadZip}
                  disabled={isExporting || !code}
                  className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download ZIP Package
                </button>
              </div>

              {/* Status */}
              {exportStatus && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    exportStatus.includes("✅")
                      ? "bg-green-900 text-green-100 border border-green-700"
                      : exportStatus.includes("❌")
                      ? "bg-red-900 text-red-100 border border-red-700"
                      : exportStatus.includes("⚠️")
                      ? "bg-yellow-900 text-yellow-100 border border-yellow-700"
                      : "bg-blue-900 text-blue-100 border border-blue-700"
                  }`}>
                  {exportStatus}
                </div>
              )}

              {/* Export Info */}
              <div className="text-xs text-gray-400 border-t border-gray-600 pt-4">
                <p className="mb-2">
                  <strong>ZIP Package includes:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Complete React component files</li>
                  <li>package.json with dependencies</li>
                  <li>README.md with usage instructions</li>
                  <li>Ready-to-run project structure</li>
                </ul>
              </div>
            </div>
          ) : (
            /* History Tab */
            <div className="p-6">
              {/* Export Stats */}
              <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-200 mb-2">
                  Export Statistics
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Total Exports:</span>
                    <span className="text-white ml-2">
                      {exportStats.totalExports}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">ZIP Downloads:</span>
                    <span className="text-white ml-2">
                      {exportStats.formatsUsed.zip}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Clipboard Copies:</span>
                    <span className="text-white ml-2">
                      {exportStats.formatsUsed.clipboard}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Individual Files:</span>
                    <span className="text-white ml-2">
                      {exportStats.formatsUsed.individual}
                    </span>
                  </div>
                </div>
              </div>

              {/* Export History */}
              <div>
                <h4 className="text-sm font-medium text-gray-200 mb-3">
                  Recent Exports
                </h4>
                {exportHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <svg
                      className="w-12 h-12 mx-auto mb-4"
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
                    <p>No exports yet</p>
                    <p className="text-xs">
                      Export your component to see history here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {exportHistory.map((exportItem, index) => (
                      <div
                        key={exportItem.id || index}
                        className="p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-200">
                              {exportItem.componentName}
                            </span>
                            <span className="ml-2 px-2 py-1 bg-blue-900 text-blue-100 text-xs rounded">
                              {exportItem.format}
                            </span>
                            {exportItem.type && (
                              <span className="ml-1 px-2 py-1 bg-gray-600 text-gray-200 text-xs rounded">
                                {exportItem.type}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(
                              exportItem.timestamp
                            ).toLocaleTimeString()}
                          </span>
                        </div>
                        {(exportItem.codeSize || exportItem.cssSize) && (
                          <div className="mt-2 text-xs text-gray-400">
                            {exportItem.codeSize &&
                              `Code: ${exportItem.codeSize} chars`}
                            {exportItem.codeSize && exportItem.cssSize && " • "}
                            {exportItem.cssSize &&
                              `CSS: ${exportItem.cssSize} chars`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
