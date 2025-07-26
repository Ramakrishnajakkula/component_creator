import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  undo,
  redo,
  goToVersion,
  updateVersionDescription,
  getUndoRedoState,
  getVersionsForSession,
} from "../../store/slices/versionHistorySlice";
import { setEditorCode, setEditorCSS } from "../../store/slices/editorSlice";

const VersionHistoryPanel = ({ isOpen, onClose, sessionId }) => {
  const dispatch = useDispatch();
  const {
    canUndo,
    canRedo,
    currentVersion: currentIndex,
    totalVersions,
  } = useSelector(getUndoRedoState);
  const sessionVersions = useSelector((state) =>
    getVersionsForSession(state, sessionId)
  );

  const [editingDescription, setEditingDescription] = useState(null);
  const [newDescription, setNewDescription] = useState("");

  const handleUndo = () => {
    if (canUndo) {
      dispatch(undo());
      const versions = sessionVersions;
      const newCurrentIndex = Math.max(0, currentIndex - 1);
      const version = versions[newCurrentIndex];
      if (version) {
        dispatch(setEditorCode(version.code));
        dispatch(setEditorCSS(version.css));
      }
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      dispatch(redo());
      const versions = sessionVersions;
      const newCurrentIndex = Math.min(versions.length - 1, currentIndex + 1);
      const version = versions[newCurrentIndex];
      if (version) {
        dispatch(setEditorCode(version.code));
        dispatch(setEditorCSS(version.css));
      }
    }
  };

  const handleGoToVersion = (versionIndex) => {
    dispatch(goToVersion(versionIndex));
    const version = sessionVersions[versionIndex];
    if (version) {
      dispatch(setEditorCode(version.code));
      dispatch(setEditorCSS(version.css));
    }
  };

  const startEditingDescription = (versionIndex, currentDesc) => {
    setEditingDescription(versionIndex);
    setNewDescription(currentDesc);
  };

  const saveDescription = (versionIndex) => {
    dispatch(
      updateVersionDescription({ versionIndex, description: newDescription })
    );
    setEditingDescription(null);
    setNewDescription("");
  };

  const cancelEditingDescription = () => {
    setEditingDescription(null);
    setNewDescription("");
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDiffStats = (version, prevVersion) => {
    if (!prevVersion) return { added: 0, removed: 0 };

    const currentLines = version.code.split("\n").length;
    const prevLines = prevVersion.code.split("\n").length;

    return {
      added: Math.max(0, currentLines - prevLines),
      removed: Math.max(0, prevLines - currentLines),
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Version History
            </h3>
            <span className="text-sm text-gray-500">
              {totalVersions} version{totalVersions !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Undo/Redo Controls */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>

            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6"
                />
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600">
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
        </div>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto p-6">
          {sessionVersions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium">No version history</h3>
              <p className="mt-2">
                Make some changes to create version history
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionVersions.map((version, index) => {
                const isCurrentVersion = index === currentIndex;
                const prevVersion =
                  index > 0 ? sessionVersions[index - 1] : null;
                const diffStats = getDiffStats(version, prevVersion);

                return (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                      isCurrentVersion
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      !isCurrentVersion && handleGoToVersion(index)
                    }>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              isCurrentVersion
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                            Version {index + 1}
                          </span>

                          {isCurrentVersion && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              Current
                            </span>
                          )}

                          {(diffStats.added > 0 || diffStats.removed > 0) && (
                            <div className="flex items-center space-x-1 text-xs">
                              {diffStats.added > 0 && (
                                <span className="text-green-600">
                                  +{diffStats.added}
                                </span>
                              )}
                              {diffStats.removed > 0 && (
                                <span className="text-red-600">
                                  -{diffStats.removed}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mb-2">
                          {editingDescription === index ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={newDescription}
                                onChange={(e) =>
                                  setNewDescription(e.target.value)
                                }
                                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter description..."
                                autoFocus
                              />
                              <button
                                onClick={() => saveDescription(index)}
                                className="text-green-600 hover:text-green-800">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={cancelEditingDescription}
                                className="text-red-600 hover:text-red-800">
                                <svg
                                  className="w-4 h-4"
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
                          ) : (
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 flex-1">
                                {version.description}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingDescription(
                                    index,
                                    version.description
                                  );
                                }}
                                className="text-gray-400 hover:text-gray-600">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-500">
                          {formatTimestamp(version.timestamp)}
                        </p>
                      </div>

                      {isCurrentVersion && (
                        <div className="ml-4">
                          <svg
                            className="w-5 h-5 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>Use Ctrl+Z / Ctrl+Y for quick undo/redo</div>
            <div>Click on any version to restore it</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryPanel;
