import { useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addVersion } from "../../store/slices/versionHistorySlice";

const AutoSave = ({ sessionId, interval = 30000 }) => {
  // Auto-save every 30 seconds
  const dispatch = useDispatch();
  const { code, css } = useSelector((state) => state.editor);
  const lastSavedRef = useRef({ code: "", css: "" });
  const autoSaveTimeoutRef = useRef(null);

  const saveVersion = useCallback(
    (description, isAutoSave = false) => {
      if (sessionId && sessionId !== "undefined" && (code || css)) {
        dispatch(
          addVersion({
            sessionId,
            code,
            css,
            description,
            isAutoSave,
          })
        );
        lastSavedRef.current = { code, css };
      }
    },
    [sessionId, code, css, dispatch]
  );

  useEffect(() => {
    if (!sessionId || sessionId === "undefined") return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Check if content has changed
    const hasChanged =
      code !== lastSavedRef.current.code || css !== lastSavedRef.current.css;

    if (hasChanged && (code || css)) {
      // Set up auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveVersion("Auto-saved version", true);
      }, interval);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [code, css, sessionId, interval, saveVersion]);

  // Save on unmount
  useEffect(() => {
    return () => {
      const hasChanged =
        code !== lastSavedRef.current.code || css !== lastSavedRef.current.css;

      if (hasChanged) {
        saveVersion("Session end save", true);
      }
    };
  }, [saveVersion, code, css]);

  return null; // This component doesn't render anything
};

export default AutoSave;
