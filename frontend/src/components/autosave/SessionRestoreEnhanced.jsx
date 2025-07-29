import React, { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { apiService } from "../../services/apiEnhanced";
import { useApiError } from "../../hooks/useApiError";
import { setEditorCode, setEditorCSS } from "../../store/slices/editorSlice";
import { loadChatHistory } from "../../store/slices/chatSlice";
import { SessionFallback } from "../api/ApiErrorProvider";
import { LoadingSpinner } from "../common/Loading";

export const SessionRestoreEnhanced = ({
  sessionId,
  onRestoreComplete,
  onRestoreError,
  showLoadingIndicator = true,
}) => {
  const dispatch = useDispatch();
  const [restoreStatus, setRestoreStatus] = useState("idle"); // idle, loading, success, error, fallback
  const [errorMessage, setErrorMessage] = useState("");
  const [fallbackData, setFallbackData] = useState(null);
  const { serverStatus } = useApiError();

  const restoreFromLocal = useCallback(() => {
    try {
      // Try to find saved session data in localStorage
      const savedData = localStorage.getItem(`session_${sessionId}`);
      if (savedData) {
        const sessionData = JSON.parse(savedData);
        setFallbackData(sessionData);

        // Restore to Redux store
        if (sessionData.code) {
          dispatch(setEditorCode(sessionData.code));
        }
        if (sessionData.css) {
          dispatch(setEditorCSS(sessionData.css));
        }
        if (sessionData.messages && sessionData.messages.length > 0) {
          dispatch(loadChatHistory(sessionData.messages));
        }

        setRestoreStatus("fallback");
        onRestoreComplete?.({
          ...sessionData,
          source: "local",
          message: "Session restored from local storage",
        });

        return true;
      }

      // Try to find auto-save data
      const autoSaveKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith(`autosave_${sessionId}`)
      );

      if (autoSaveKeys.length > 0) {
        // Get the most recent auto-save
        const latestKey = autoSaveKeys.sort().pop();
        const autoSaveData = JSON.parse(localStorage.getItem(latestKey));

        setFallbackData(autoSaveData);

        if (autoSaveData.code) {
          dispatch(setEditorCode(autoSaveData.code));
        }
        if (autoSaveData.css) {
          dispatch(setEditorCSS(autoSaveData.css));
        }

        setRestoreStatus("fallback");
        onRestoreComplete?.({
          ...autoSaveData,
          source: "autosave",
          message: "Session restored from auto-save data",
        });

        return true;
      }

      return false;
    } catch {
      // Silent local restore failure
      return false;
    }
  }, [sessionId, dispatch, onRestoreComplete]);

  const restoreSession = useCallback(async () => {
    if (!sessionId || sessionId === "undefined") {
      setRestoreStatus("error");
      setErrorMessage("Invalid session ID");
      onRestoreError?.("Invalid session ID");
      return;
    }

    setRestoreStatus("loading");
    setErrorMessage("");

    try {
      // Try to restore from server
      const response = await apiService.sessions.restoreSession(sessionId);

      if (response.data) {
        // Restore to Redux store
        if (response.data.code) {
          dispatch(setEditorCode(response.data.code));
        }
        if (response.data.css) {
          dispatch(setEditorCSS(response.data.css));
        }
        if (response.data.messages && response.data.messages.length > 0) {
          dispatch(loadChatHistory(response.data.messages));
        }

        setRestoreStatus("success");
        onRestoreComplete?.(response.data);
      }
    } catch (error) {
      // Try local fallback for 404 errors or server issues
      if (error.response?.status === 404 || serverStatus === "offline") {
        const localRestoreSuccessful = restoreFromLocal();

        if (!localRestoreSuccessful) {
          setRestoreStatus("error");
          setErrorMessage("No session data found locally or on server");
          onRestoreError?.("Session not found");
        }
      } else {
        setRestoreStatus("error");
        setErrorMessage(error.message || "Failed to restore session");
        onRestoreError?.(error);
      }
    }
  }, [
    sessionId,
    dispatch,
    onRestoreComplete,
    onRestoreError,
    serverStatus,
    restoreFromLocal,
  ]);

  // Auto-restore on component mount
  useEffect(() => {
    if (sessionId && sessionId !== "undefined") {
      restoreSession();
    }
  }, [sessionId, restoreSession]);

  // Status indicator component
  const RestoreStatusIndicator = () => {
    if (!showLoadingIndicator || restoreStatus === "idle") return null;

    const getStatusContent = () => {
      switch (restoreStatus) {
        case "loading":
          return <LoadingSpinner size="small" text="Restoring session..." />;
        case "success":
          return (
            <div className="flex items-center text-green-600 text-sm">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Session restored successfully
            </div>
          );
        case "fallback":
          return (
            <SessionFallback fallbackMessage="">
              <div className="flex items-center text-amber-600 text-sm bg-amber-50 px-2 py-1 rounded">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Session restored from local storage
                {fallbackData?.timestamp && (
                  <span className="ml-1 text-xs">
                    (saved{" "}
                    {new Date(fallbackData.timestamp).toLocaleDateString()})
                  </span>
                )}
              </div>
            </SessionFallback>
          );
        case "error":
          return (
            <div className="flex items-center text-red-600 text-sm bg-red-50 px-2 py-1 rounded">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errorMessage}
              <button
                onClick={restoreSession}
                className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs"
                aria-label="Retry session restore">
                Retry
              </button>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="session-restore-status" role="status" aria-live="polite">
        {getStatusContent()}
      </div>
    );
  };

  return <RestoreStatusIndicator />;
};

export default SessionRestoreEnhanced;
