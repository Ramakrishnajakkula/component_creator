import { useEffect, useRef, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addVersion } from "../../store/slices/versionHistorySlice";
import { apiService } from "../../services/apiEnhanced";
import { useApiError } from "../../hooks/useApiError";
import { SessionFallback } from "../api/ApiErrorProvider";

const AutoSaveEnhanced = ({ sessionId, interval = 30000 }) => {
  const dispatch = useDispatch();
  const { code, css } = useSelector((state) => state.editor);
  const { messages } = useSelector((state) => state.chat);
  const { serverStatus } = useApiError();

  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle', 'saving', 'saved', 'error'
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSaves, setPendingSaves] = useState([]);
  const [localSaveCount, setLocalSaveCount] = useState(0);

  const lastSavedRef = useRef({ code: "", css: "", messagesCount: 0 });
  const autoSaveTimeoutRef = useRef(null);

  // Save to server with retry logic and fallback
  const saveToServer = useCallback(
    async (saveData, retryCount = 0) => {
      const maxRetries = 3;

      try {
        setSaveStatus("saving");

        const response = await apiService.sessions.saveAutosave({
          sessionId,
          ...saveData,
          timestamp: new Date().toISOString(),
        });

        setSaveStatus("saved");
        setLastSaveTime(new Date());

        // Clear this save from pending saves
        setPendingSaves((prev) =>
          prev.filter((save) => save.timestamp !== saveData.timestamp)
        );

        return response.data;
      } catch (error) {
        // For 404 errors, use local storage fallback
        if (error.response?.status === 404) {
          try {
            const localKey = `autosave_${sessionId}_${Date.now()}`;
            const fallbackData = {
              ...saveData,
              sessionId,
              timestamp: new Date().toISOString(),
            };
            localStorage.setItem(localKey, JSON.stringify(fallbackData));
            setLocalSaveCount((prev) => prev + 1);
            setSaveStatus("saved");
            setLastSaveTime(new Date());
            // Silent local storage fallback for 404 error
            return { id: localKey, source: "local" };
          } catch {
            // Silent local storage fallback failure
            setSaveStatus("error");
            return null;
          }
        }

        if (retryCount < maxRetries && isOnline) {
          // Retry with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => {
            saveToServer(saveData, retryCount + 1);
          }, delay);
        } else {
          // Add to pending saves for later
          if (isOnline) {
            setSaveStatus("error");
          } else {
            // Store for when we're back online
            setPendingSaves((prev) => [...prev, saveData]);
            setSaveStatus("offline");
          }
        }
      }
    },
    [sessionId, isOnline]
  );

  // Process pending saves when back online
  const processPendingSaves = useCallback(async () => {
    if (pendingSaves.length === 0 || !isOnline) return;

    for (const saveData of pendingSaves) {
      await saveToServer(saveData);
      // Small delay between saves to avoid overwhelming server
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }, [pendingSaves, isOnline, saveToServer]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Process pending saves when back online
      processPendingSaves();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [processPendingSaves]);

  // Enhanced save function with server backup
  const saveVersion = useCallback(
    async (description, isAutoSave = false, trigger = "manual") => {
      if (!sessionId || sessionId === "undefined") return;

      const saveData = {
        code,
        css,
        description,
        isAutoSave,
        trigger,
        messagesCount: messages.length,
        timestamp: Date.now(),
      };

      // Always save to local version history first
      if (code || css) {
        dispatch(
          addVersion({
            sessionId,
            code,
            css,
            description,
            isAutoSave,
            trigger,
          })
        );
        lastSavedRef.current = {
          code,
          css,
          messagesCount: messages.length,
        };
      }

      // Save to server if online, queue if offline
      if (isOnline) {
        await saveToServer(saveData);
      } else {
        setPendingSaves((prev) => [...prev, saveData]);
        setSaveStatus("offline");
      }
    },
    [sessionId, code, css, messages.length, dispatch, isOnline, saveToServer]
  );

  // Auto-save logic with multiple triggers
  useEffect(() => {
    if (!sessionId || sessionId === "undefined") return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Check what has changed
    const codeChanged = code !== lastSavedRef.current.code;
    const cssChanged = css !== lastSavedRef.current.css;
    const messagesChanged =
      messages.length !== lastSavedRef.current.messagesCount;

    const hasSignificantChange = codeChanged || cssChanged;
    const hasNewMessage =
      messagesChanged && messages.length > lastSavedRef.current.messagesCount;

    if (hasSignificantChange || hasNewMessage) {
      let trigger = "auto";
      let description = "Auto-saved version";

      if (hasNewMessage) {
        trigger = "chat";
        description = `Auto-saved after chat interaction (${messages.length} messages)`;
      } else if (codeChanged && cssChanged) {
        description = "Auto-saved code and CSS changes";
      } else if (codeChanged) {
        description = "Auto-saved code changes";
      } else if (cssChanged) {
        description = "Auto-saved CSS changes";
      }

      // Immediate save for chat interactions, delayed for code changes
      const delay = hasNewMessage ? 1000 : interval;

      autoSaveTimeoutRef.current = setTimeout(() => {
        saveVersion(description, true, trigger);
      }, delay);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [sessionId, code, css, messages.length, interval, saveVersion]);

  // Manual save function for emergency saves
  const forceSave = useCallback(() => {
    saveVersion("Manual save", false, "manual");
  }, [saveVersion]);

  // Emergency save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasUnsavedChanges =
        code !== lastSavedRef.current.code ||
        css !== lastSavedRef.current.css ||
        messages.length !== lastSavedRef.current.messagesCount;

      if (hasUnsavedChanges) {
        // Attempt synchronous save
        forceSave();

        // Browser warning
        const message =
          "You have unsaved changes. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [code, css, messages.length, forceSave]);

  // Auto-save status indicator with enhanced feedback
  const getStatusIndicator = () => {
    switch (saveStatus) {
      case "saving":
        return {
          color: "text-blue-400",
          icon: "🔄",
          text: "Saving...",
        };
      case "saved": {
        const isLocalSave = localSaveCount > 0 || serverStatus === "offline";
        return {
          color: isLocalSave ? "text-green-500" : "text-green-400",
          icon: isLocalSave ? "💾" : "✅",
          text: `${isLocalSave ? "Saved locally" : "Saved"}${
            lastSaveTime ? ` at ${lastSaveTime.toLocaleTimeString()}` : ""
          }`,
        };
      }
      case "error":
        return {
          color: "text-red-400",
          icon: "❌",
          text: "Save failed",
        };
      case "offline":
        return {
          color: "text-yellow-400",
          icon: "📴",
          text: `Offline (${pendingSaves.length} pending)`,
        };
      default:
        return {
          color: "text-gray-400",
          icon: "💾",
          text: "Auto-save enabled",
        };
    }
  };

  const status = getStatusIndicator();

  // Render auto-save status with enhanced feedback
  return (
    <div className="flex items-center space-x-2 text-xs">
      <span className="text-gray-500">Auto-save:</span>
      <span className={status.color}>
        {status.icon} {status.text}
      </span>
      {localSaveCount > 0 && (
        <span className="text-blue-500 bg-blue-50 px-1 py-0.5 rounded text-xs">
          {localSaveCount} local
        </span>
      )}
      {serverStatus === "offline" && (
        <SessionFallback fallbackMessage="">
          <span className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded text-xs">
            ⚠️ Offline mode
          </span>
        </SessionFallback>
      )}
      {pendingSaves.length > 0 && (
        <button
          onClick={processPendingSaves}
          className="text-blue-400 hover:text-blue-300 underline"
          disabled={!isOnline}
          title={`${pendingSaves.length} saves pending`}>
          Sync now
        </button>
      )}
      <button
        onClick={forceSave}
        className="text-gray-400 hover:text-gray-300 underline"
        title="Force save now">
        Save now
      </button>
    </div>
  );
};

export default AutoSaveEnhanced;
