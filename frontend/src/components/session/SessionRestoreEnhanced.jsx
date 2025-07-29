import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../../services/apiEnhanced";
import { SessionFallback, GracefulApiComponent } from "../api/ApiErrorProvider";
import { useApiError } from "../../hooks/useApiError";
import { ApiErrorDisplay } from "../error/ApiErrorHandling";
import { LoadingSpinner } from "../loading/Loading";
import { AccessibleButton } from "../accessibility/KeyboardNavigation";

export const SessionRestoreEnhanced = ({ sessionId, code, css, onRestore }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [restoreOptions, setRestoreOptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const { addError, serverStatus } = useApiError();

  // Check for recoverable sessions with enhanced error handling
  const checkForRecoverableSessions = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to get autosave history and session restore data
      const [autosaveHistory, sessionData] = await Promise.allSettled([
        apiService.sessions.getAutosaveHistory(sessionId, 5),
        apiService.sessions.restoreSession(sessionId),
      ]);

      const options = [];

      // Process autosave history
      if (
        autosaveHistory.status === "fulfilled" &&
        autosaveHistory.value?.length > 0
      ) {
        autosaveHistory.value.forEach((save) => {
          options.push({
            id: save.id,
            type: "autosave",
            timestamp: save.timestamp,
            preview: save.code?.substring(0, 100) + "...",
            data: save,
          });
        });
      }

      // Process session restore data
      if (sessionData.status === "fulfilled" && sessionData.value) {
        options.push({
          id: sessionData.value.id,
          type: "session",
          timestamp: sessionData.value.timestamp,
          preview: sessionData.value.code?.substring(0, 100) + "...",
          data: sessionData.value,
        });
      }

      // Check for local storage fallbacks
      const localSaves = await apiService.sessions.getAllAutosaves();
      if (localSaves?.length > 0) {
        localSaves.forEach((save) => {
          if (save.source === "local" && save.sessionId === sessionId) {
            options.push({
              id: save.id,
              type: "local",
              timestamp: save.timestamp,
              preview: save.code?.substring(0, 100) + "...",
              data: save,
              isLocal: true,
            });
          }
        });
      }

      // Sort by timestamp (newest first)
      options.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRestoreOptions(options);

      // Auto-show modal if there are restorable sessions and current session is empty
      if (options.length > 0 && !code && !css) {
        setShowModal(true);
      }
    } catch (error) {
      // Silent session check failure
      setError(error);

      // Only show error for non-404 errors
      if (error.response?.status !== 404) {
        addError({
          title: "Session Recovery Error",
          message:
            error.userMessage || "Failed to check for recoverable sessions",
          type: error.apiErrorType,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, code, css, addError]);

  // Check for recoverable sessions on component mount
  useEffect(() => {
    checkForRecoverableSessions();
  }, [checkForRecoverableSessions]);

  const restoreSession = useCallback(
    async (option) => {
      if (!option) return;

      setIsLoading(true);
      try {
        const { data } = option;

        if (option.isLocal) {
          // Handle local storage restore
          onRestore?.({
            code: data.code || "",
            css: data.css || "",
            framework: data.framework || "react",
            timestamp: data.timestamp,
          });
        } else {
          // Handle API restore
          onRestore?.({
            code: data.code || "",
            css: data.css || "",
            framework: data.framework || "react",
            timestamp: data.timestamp,
          });
        }

        setShowModal(false);
        setRestoreOptions([]);
      } catch (error) {
        // Silent restore failure
        setError(error);
        addError({
          title: "Restore Failed",
          message: error.userMessage || "Failed to restore session",
          type: error.apiErrorType,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [onRestore, addError]
  );

  // Don't show anything if server is offline and no local options
  if (serverStatus === "offline" && restoreOptions.length === 0) {
    return (
      <SessionFallback fallbackMessage="Session restore is not available while offline. Your current work will be saved locally." />
    );
  }

  return (
    <GracefulApiComponent
      fallback={
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            Session restore temporarily unavailable. Continue working - your
            progress will be saved locally.
          </p>
        </div>
      }>
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-3 flex items-center">
            <LoadingSpinner size="small" className="mr-2" />
            <span className="text-sm text-gray-600">
              Checking for saved sessions...
            </span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && error.response?.status !== 404 && (
        <div className="mb-4">
          <ApiErrorDisplay
            error={error}
            onRetry={checkForRecoverableSessions}
            onDismiss={() => setError(null)}
            showDetails={false}
          />
        </div>
      )}

      {/* Restore modal */}
      {showModal && restoreOptions.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Restore Previous Session</h2>
            <p className="text-gray-600 mb-4">
              We found {restoreOptions.length} saved session
              {restoreOptions.length > 1 ? "s" : ""}. Would you like to restore
              one?
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {restoreOptions.map((option) => (
                <div
                  key={option.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => restoreSession(option)}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium capitalize">
                      {option.type} {option.isLocal && "(Local)"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(option.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 font-mono bg-gray-100 p-2 rounded">
                    {option.preview || "No preview available"}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <AccessibleButton
                variant="secondary"
                onClick={() => setShowModal(false)}>
                Skip
              </AccessibleButton>
              <AccessibleButton
                variant="default"
                onClick={() => restoreSession(restoreOptions[0])}
                disabled={restoreOptions.length === 0}>
                Restore Latest
              </AccessibleButton>
            </div>
          </div>
        </div>
      )}

      {/* Manual restore trigger */}
      {restoreOptions.length > 0 && !showModal && (
        <div className="mb-4">
          <AccessibleButton
            variant="ghost"
            size="small"
            onClick={() => setShowModal(true)}
            className="text-blue-600 hover:text-blue-800">
            📁 {restoreOptions.length} saved session
            {restoreOptions.length > 1 ? "s" : ""} available
          </AccessibleButton>
        </div>
      )}
    </GracefulApiComponent>
  );
};

export default SessionRestoreEnhanced;
