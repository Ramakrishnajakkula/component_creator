import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setEditorCode, setEditorCSS } from "../../store/slices/editorSlice";
import { getVersionsForSession } from "../../store/slices/versionHistorySlice";

const SessionRestore = ({ sessionId }) => {
  const dispatch = useDispatch();
  const { code, css } = useSelector((state) => state.editor);
  const sessionVersions = useSelector((state) =>
    getVersionsForSession(state, sessionId)
  );

  // Restore session on load
  useEffect(() => {
    if (!sessionId || sessionId === "undefined") return;

    // Check if we have version history for this session
    if (sessionVersions.length > 0 && !code && !css) {
      const latestVersion = sessionVersions[sessionVersions.length - 1];

      // Restore the latest version
      if (latestVersion.code) {
        dispatch(setEditorCode(latestVersion.code));
      }
      if (latestVersion.css) {
        dispatch(setEditorCSS(latestVersion.css));
      }

      console.log(
        `Restored session ${sessionId} with ${sessionVersions.length} versions`
      );
    }
  }, [sessionId, sessionVersions, code, css, dispatch]);

  // Save to localStorage for browser refresh recovery
  useEffect(() => {
    if (sessionId && sessionId !== "undefined" && (code || css)) {
      const sessionData = {
        sessionId,
        code,
        css,
        timestamp: Date.now(),
        versions: sessionVersions.length,
      };

      try {
        localStorage.setItem(
          `session_${sessionId}`,
          JSON.stringify(sessionData)
        );
      } catch (error) {
        console.warn("Failed to save session to localStorage:", error);
      }
    }
  }, [sessionId, code, css, sessionVersions.length]);

  // Restore from localStorage on browser refresh
  useEffect(() => {
    if (sessionId && sessionId !== "undefined" && !code && !css) {
      try {
        const savedSession = localStorage.getItem(`session_${sessionId}`);
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);

          // Check if the saved session is recent (within 24 hours)
          const hoursSinceLastSave =
            (Date.now() - sessionData.timestamp) / (1000 * 60 * 60);

          if (hoursSinceLastSave < 24 && sessionData.sessionId === sessionId) {
            if (sessionData.code && !code) {
              dispatch(setEditorCode(sessionData.code));
            }
            if (sessionData.css && !css) {
              dispatch(setEditorCSS(sessionData.css));
            }

            console.log(`Restored session ${sessionId} from localStorage`);
          } else {
            // Clean up old localStorage data
            localStorage.removeItem(`session_${sessionId}`);
          }
        }
      } catch (error) {
        console.warn("Failed to restore session from localStorage:", error);
      }
    }
  }, [sessionId, code, css, dispatch]);

  // Clean up localStorage on component unmount
  useEffect(() => {
    return () => {
      // Don't clean up immediately, allow for page refresh recovery
    };
  }, []);

  return null; // This component doesn't render anything
};

export default SessionRestore;
