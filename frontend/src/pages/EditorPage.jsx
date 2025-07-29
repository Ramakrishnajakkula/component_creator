import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import ChatPanel from "../components/chat/ChatPanel";
import ComponentPreview from "../components/preview/ComponentPreview";
import CodeEditor from "../components/editor/CodeEditor";
import ExportPanelNew from "../components/export/ExportPanelNew";
import VersionHistoryPanel from "../components/version/VersionHistoryPanel";
import CodeDiffViewer from "../components/diff/CodeDiffViewer";
import ResizableLayout from "../components/ui/ResizableLayout";
import PanelControls from "../components/ui/PanelControls";
import { loadChatHistory } from "../store/slices/chatSlice";
import { setEditorCode, setEditorCSS } from "../store/slices/editorSlice";
import { fetchSessionById } from "../store/slices/sessionSlice";
import {
  addVersion,
  undo,
  redo,
  getUndoRedoState,
} from "../store/slices/versionHistorySlice";

const EditorPage = () => {
  const { sessionId } = useParams();
  const dispatch = useDispatch();

  const { messages } = useSelector((state) => state.chat);
  const { code, css } = useSelector((state) => state.editor);
  const { currentSession, isLoading } = useSelector((state) => state.sessions);

  const [layout, setLayout] = useState("three-column"); // 'three-column', 'two-column', 'preview-only'
  const [previewError, setPreviewError] = useState(null);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCodeDiff, setShowCodeDiff] = useState(false);

  // Refs to track the last loaded code to prevent feedback loops
  const lastLoadedCodeRef = useRef(null);
  const lastLoadedCssRef = useRef(null);

  // Panel sizes state (in percentages)
  const [panelSizes, setPanelSizes] = useState({
    threeColumn: [25, 40, 35], // Chat, Editor, Preview
    twoColumn: [30, 70], // Chat, Editor+Preview
  });

  // Version history state
  const { canUndo, canRedo } = useSelector(getUndoRedoState);

  // Load session and chat history when component mounts
  useEffect(() => {
    console.log("EditorPage sessionId from useParams:", sessionId);
    console.log("EditorPage sessionId type:", typeof sessionId);

    if (sessionId && sessionId !== "undefined") {
      console.log("Loading session:", sessionId);
      dispatch(fetchSessionById(sessionId));
      dispatch(loadChatHistory(sessionId));
    } else if (!sessionId) {
      // Redirect to dashboard if no sessionId provided
      console.warn("No sessionId provided, redirecting to dashboard");
      // You could add navigation logic here if needed
    } else {
      console.error("Invalid sessionId detected:", sessionId);
    }
  }, [sessionId, dispatch]);

  // Extract code and CSS from the latest AI message when messages change
  useEffect(() => {
    const latestCodeMessage = messages
      .filter((msg) => msg.type === "ai" && (msg.code || msg.componentCode))
      .pop();

    console.log("🔍 Checking for component code in messages:", {
      totalMessages: messages.length,
      aiMessages: messages.filter((msg) => msg.type === "ai").length,
      messagesWithCode: messages.filter(
        (msg) => msg.type === "ai" && (msg.code || msg.componentCode)
      ).length,
      latestCodeMessage: latestCodeMessage
        ? {
            id: latestCodeMessage.id,
            hasCode: !!latestCodeMessage.code,
            hasComponentCode: !!latestCodeMessage.componentCode,
            codeLength: latestCodeMessage.code?.length || 0,
          }
        : null,
    });

    if (latestCodeMessage) {
      // Check if message has componentCode field (new format)
      if (latestCodeMessage.componentCode) {
        if (
          latestCodeMessage.componentCode.jsx &&
          latestCodeMessage.componentCode.jsx !== lastLoadedCodeRef.current
        ) {
          console.log("📝 Loading JSX from message componentCode");
          lastLoadedCodeRef.current = latestCodeMessage.componentCode.jsx;
          dispatch(setEditorCode(latestCodeMessage.componentCode.jsx));
        }
        if (
          latestCodeMessage.componentCode.css &&
          latestCodeMessage.componentCode.css !== lastLoadedCssRef.current
        ) {
          console.log("🎨 Loading CSS from message componentCode");
          lastLoadedCssRef.current = latestCodeMessage.componentCode.css;
          dispatch(setEditorCSS(latestCodeMessage.componentCode.css));
        }
      }
      // Fallback to old format
      else if (
        latestCodeMessage.code &&
        latestCodeMessage.code !== lastLoadedCodeRef.current
      ) {
        console.log("📝 Loading JSX from message code field");
        lastLoadedCodeRef.current = latestCodeMessage.code;
        dispatch(setEditorCode(latestCodeMessage.code));
      }

      // Also extract CSS if available in old format
      if (
        latestCodeMessage.css &&
        latestCodeMessage.css !== lastLoadedCssRef.current
      ) {
        console.log("🎨 Loading CSS from message css field");
        lastLoadedCssRef.current = latestCodeMessage.css;
        dispatch(setEditorCSS(latestCodeMessage.css));
      }
    }
  }, [messages, dispatch]); // Using refs to track previous values instead of code/css deps

  // Load component code from current session when it's available
  useEffect(() => {
    if (currentSession && currentSession.componentCode) {
      if (
        currentSession.componentCode.jsx &&
        currentSession.componentCode.jsx !== lastLoadedCodeRef.current
      ) {
        lastLoadedCodeRef.current = currentSession.componentCode.jsx;
        dispatch(setEditorCode(currentSession.componentCode.jsx));
      }
      if (
        currentSession.componentCode.css &&
        currentSession.componentCode.css !== lastLoadedCssRef.current
      ) {
        lastLoadedCssRef.current = currentSession.componentCode.css;
        dispatch(setEditorCSS(currentSession.componentCode.css));
      }
    }
  }, [currentSession, dispatch]); // Using refs to track previous values instead of code/css deps

  const handleCodeChange = (newCode) => {
    dispatch(setEditorCode(newCode));

    // Add to version history when code changes significantly
    if (newCode !== code && sessionId) {
      dispatch(
        addVersion({
          sessionId,
          code: newCode,
          css: css,
          description: `Code updated at ${new Date().toLocaleTimeString()}`,
        })
      );
    }
  };

  const handleCSSChange = (newCSS) => {
    dispatch(setEditorCSS(newCSS));

    // Add to version history when CSS changes significantly
    if (newCSS !== css && sessionId) {
      dispatch(
        addVersion({
          sessionId,
          code: code,
          css: newCSS,
          description: `CSS updated at ${new Date().toLocaleTimeString()}`,
        })
      );
    }
  };

  const handlePreviewError = (error) => {
    setPreviewError(error);
  };

  const handlePreviewSuccess = () => {
    setPreviewError(null);
  };

  // Version history handlers
  const handleUndo = () => {
    if (canUndo) {
      dispatch(undo());
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      dispatch(redo());
    }
  };

  // Panel control handlers
  const handleResetSizes = useCallback(() => {
    setPanelSizes({
      threeColumn: [25, 40, 35],
      twoColumn: [30, 70],
    });
  }, []);

  const handleEqualSizes = useCallback(() => {
    if (layout === "three-column") {
      setPanelSizes((prev) => ({
        ...prev,
        threeColumn: [33.33, 33.33, 33.34],
      }));
    } else if (layout === "two-column") {
      setPanelSizes((prev) => ({ ...prev, twoColumn: [50, 50] }));
    }
  }, [layout]);

  // Keyboard shortcuts for undo/redo and panel controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          dispatch(undo());
        }
      } else if (
        (e.ctrlKey && e.key === "y") ||
        (e.ctrlKey && e.shiftKey && e.key === "Z")
      ) {
        e.preventDefault();
        if (canRedo) {
          dispatch(redo());
        }
      } else if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        handleEqualSizes();
      } else if (e.ctrlKey && e.key === "r") {
        e.preventDefault();
        handleResetSizes();
      } else if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        const layouts = ["three-column", "two-column", "preview-only"];
        const currentIndex = layouts.indexOf(layout);
        const nextLayout = layouts[(currentIndex + 1) % layouts.length];
        setLayout(nextLayout);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canUndo, canRedo, dispatch, layout, handleEqualSizes, handleResetSizes]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-100">
              {currentSession?.title || "New Component Session"}
            </h1>
            <span className="text-sm text-gray-400">
              {currentSession?.updatedAt &&
                `Last updated ${new Date(
                  currentSession.updatedAt
                ).toLocaleString()}`}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Layout Toggle */}
            <div className="flex items-center bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setLayout("three-column")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  layout === "three-column"
                    ? "bg-gray-600 text-gray-100 shadow-sm"
                    : "text-gray-300 hover:text-gray-100"
                }`}
                title="Three column layout">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  />
                </svg>
              </button>

              <button
                onClick={() => setLayout("two-column")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  layout === "two-column"
                    ? "bg-gray-600 text-gray-100 shadow-sm"
                    : "text-gray-300 hover:text-gray-100"
                }`}
                title="Two column layout">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h6a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM16 5a1 1 0 011-1h2a1 1 0 011 1v14a1 1 0 01-1 1h-2a1 1 0 01-1-1V5z"
                  />
                </svg>
              </button>

              <button
                onClick={() => setLayout("preview-only")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  layout === "preview-only"
                    ? "bg-gray-600 text-gray-100 shadow-sm"
                    : "text-gray-300 hover:text-gray-100"
                }`}
                title="Preview only">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              {previewError ? (
                <div className="flex items-center text-red-600">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">Preview Error</span>
                </div>
              ) : code ? (
                <div className="flex items-center text-green-600">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">Ready</span>
                </div>
              ) : (
                <div className="flex items-center text-gray-500">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">Waiting for code</span>
                </div>
              )}
            </div>

            {/* Export Button */}
            <button
              onClick={() => setShowExportPanel(true)}
              disabled={!code}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Export component">
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
              Export
            </button>

            {/* Version History Controls */}
            <div className="flex items-center space-x-1 border border-gray-300 rounded-md">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)">
                <svg
                  className="w-4 h-4"
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
                  className="w-4 h-4"
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

              <div className="w-px h-6 bg-gray-300"></div>

              <button
                onClick={() => setShowVersionHistory(true)}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Version History">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              <button
                onClick={() => setShowCodeDiff(true)}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Compare Versions">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>

              <div className="w-px h-6 bg-gray-300"></div>

              <PanelControls
                currentLayout={layout}
                onLayoutChange={setLayout}
                onResetSizes={handleResetSizes}
                onEqualSizes={handleEqualSizes}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Three Column Layout */}
        {layout === "three-column" && (
          <ResizableLayout
            direction="horizontal"
            panels={[
              {
                content: <ChatPanel sessionId={sessionId} />,
              },
              {
                content: (
                  <div className="h-full">
                    <CodeEditor
                      onCodeChange={handleCodeChange}
                      onCSSChange={handleCSSChange}
                    />
                  </div>
                ),
              },
              {
                content: (
                  <ComponentPreview
                    code={code}
                    css={css}
                    onError={handlePreviewError}
                    onSuccess={handlePreviewSuccess}
                  />
                ),
              },
            ]}
            defaultSizes={panelSizes.threeColumn}
            minSizes={[15, 25, 20]} // Minimum percentages for each panel
            onSizesChange={(newSizes) =>
              setPanelSizes((prev) => ({ ...prev, threeColumn: newSizes }))
            }
          />
        )}

        {/* Two Column Layout */}
        {layout === "two-column" && (
          <ResizableLayout
            direction="horizontal"
            panels={[
              {
                content: <ChatPanel sessionId={sessionId} />,
              },
              {
                content: (
                  <ResizableLayout
                    direction="vertical"
                    panels={[
                      {
                        content: (
                          <div className="h-full">
                            <CodeEditor
                              onCodeChange={handleCodeChange}
                              onCSSChange={handleCSSChange}
                            />
                          </div>
                        ),
                      },
                      {
                        content: (
                          <ComponentPreview
                            code={code}
                            css={css}
                            onError={handlePreviewError}
                            onSuccess={handlePreviewSuccess}
                          />
                        ),
                      },
                    ]}
                    defaultSizes={[50, 50]}
                    minSizes={[25, 25]}
                  />
                ),
              },
            ]}
            defaultSizes={panelSizes.twoColumn}
            minSizes={[15, 30]}
            onSizesChange={(newSizes) =>
              setPanelSizes((prev) => ({ ...prev, twoColumn: newSizes }))
            }
          />
        )}

        {/* Preview Only Layout */}
        {layout === "preview-only" && (
          <ResizableLayout
            direction="horizontal"
            panels={[
              {
                content: <ChatPanel sessionId={sessionId} />,
              },
              {
                content: (
                  <ComponentPreview
                    code={code}
                    css={css}
                    onError={handlePreviewError}
                    onSuccess={handlePreviewSuccess}
                  />
                ),
              },
            ]}
            defaultSizes={[20, 80]}
            minSizes={[10, 30]}
          />
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Session: {sessionId}</span>
            <span>Messages: {messages.length}</span>
            {code && <span>Code: {code.length} characters</span>}
          </div>

          <div className="flex items-center space-x-4">
            <span>Layout: {layout.replace("-", " ")}</span>
          </div>
        </div>
      </div>

      {/* Export Panel */}
      <ExportPanelNew
        isOpen={showExportPanel}
        onClose={() => setShowExportPanel(false)}
      />

      {/* Version History Panel */}
      <VersionHistoryPanel
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        sessionId={sessionId}
      />

      {/* Code Diff Viewer */}
      <CodeDiffViewer
        isOpen={showCodeDiff}
        onClose={() => setShowCodeDiff(false)}
        sessionId={sessionId}
      />
    </div>
  );
};

export default EditorPage;
