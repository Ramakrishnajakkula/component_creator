import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setEditorCode,
  setEditorCSS,
  setActiveTab,
} from "../../store/slices/editorSlice";
import SyntaxHighlightedEditor from "./SyntaxHighlightedEditor";

const CodeEditor = ({ onCodeChange, onCSSChange }) => {
  const dispatch = useDispatch();
  const { code, css, activeTab } = useSelector((state) => state.editor);
  const jsxTextareaRef = useRef(null);
  const cssTextareaRef = useRef(null);

  const [jsxCode, setJsxCode] = useState(code || "");
  const [cssCode, setCssCode] = useState(css || "");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update local state when Redux state changes
  useEffect(() => {
    setJsxCode(code || "");
  }, [code]);

  useEffect(() => {
    setCssCode(css || "");
  }, [css]);

  // Auto-resize textareas
  const adjustTextareaHeight = (textarea) => {
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight(jsxTextareaRef.current);
  }, [jsxCode]);

  useEffect(() => {
    adjustTextareaHeight(cssTextareaRef.current);
  }, [cssCode]);

  const handleJSXChange = (e) => {
    const newCode = e.target.value;
    setJsxCode(newCode);
    dispatch(setEditorCode(newCode));
    onCodeChange?.(newCode);
    adjustTextareaHeight(e.target);
  };

  const handleCSSChange = (e) => {
    const newCSS = e.target.value;
    setCssCode(newCSS);
    dispatch(setEditorCSS(newCSS));
    onCSSChange?.(newCSS);
    adjustTextareaHeight(e.target);
  };

  const handleTabChange = (tab) => {
    dispatch(setActiveTab(tab));
  };

  const handleKeyDown = (e) => {
    // Handle common IDE shortcuts
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = "  "; // 2 spaces for indentation

      if (activeTab === "jsx") {
        const newCode =
          jsxCode.substring(0, start) + spaces + jsxCode.substring(end);
        setJsxCode(newCode);
        dispatch(setEditorCode(newCode));
        onCodeChange?.(newCode);

        // Set cursor position after the inserted spaces
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd =
            start + spaces.length;
        }, 0);
      } else {
        const newCSS =
          cssCode.substring(0, start) + spaces + cssCode.substring(end);
        setCssCode(newCSS);
        dispatch(setEditorCSS(newCSS));
        onCSSChange?.(newCSS);

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd =
            start + spaces.length;
        }, 0);
      }
    }

    // Format code (Ctrl/Cmd + Shift + F)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F") {
      e.preventDefault();
      formatCode();
    }
  };

  const formatCode = () => {
    try {
      if (activeTab === "jsx") {
        // Simple JSX formatting (you could integrate Prettier here)
        const formatted = jsxCode
          .split("\n")
          .map((line) => line.trim())
          .join("\n")
          .replace(/></g, ">\n<")
          .replace(/\s+/g, " ")
          .trim();

        setJsxCode(formatted);
        dispatch(setEditorCode(formatted));
        onCodeChange?.(formatted);
      } else {
        // Simple CSS formatting
        const formatted = cssCode
          .replace(/\s*{\s*/g, " {\n  ")
          .replace(/;\s*/g, ";\n  ")
          .replace(/\s*}\s*/g, "\n}\n")
          .replace(/,\s*/g, ",\n")
          .trim();

        setCssCode(formatted);
        dispatch(setEditorCSS(formatted));
        onCSSChange?.(formatted);
      }
    } catch (error) {
      console.error("Failed to format code:", error);
    }
  };

  const clearCode = () => {
    if (activeTab === "jsx") {
      setJsxCode("");
      dispatch(setEditorCode(""));
      onCodeChange?.("");
    } else {
      setCssCode("");
      dispatch(setEditorCSS(""));
      onCSSChange?.("");
    }
  };

  const insertTemplate = (template) => {
    const templates = {
      component: `function GeneratedComponent() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800">Hello World</h1>
      <p className="text-gray-600 mt-2">This is a sample component.</p>
    </div>
  );
}`,
      form: `function GeneratedComponent() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
      >
        Submit
      </button>
    </form>
  );
}`,
      card: `function GeneratedComponent() {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <img
        src="https://via.placeholder.com/300x200"
        alt="Card image"
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Card Title</h2>
        <p className="text-gray-600 mb-4">
          This is a sample card component with an image and content.
        </p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Learn More
        </button>
      </div>
    </div>
  );
}`,
    };

    const templateCode = templates[template];
    if (templateCode && activeTab === "jsx") {
      setJsxCode(templateCode);
      dispatch(setEditorCode(templateCode));
      onCodeChange?.(templateCode);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`flex flex-col bg-gray-800 border border-gray-700 rounded-lg overflow-hidden ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl" : "h-full"
      }`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 bg-gray-700 border-b border-gray-600">
        <div className="flex items-center space-x-1">
          {/* Tab Navigation */}
          <button
            onClick={() => handleTabChange("jsx")}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              activeTab === "jsx"
                ? "bg-blue-500 text-white"
                : "text-gray-300 hover:text-gray-100 hover:bg-gray-600"
            }`}>
            JSX
          </button>
          <button
            onClick={() => handleTabChange("css")}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              activeTab === "css"
                ? "bg-blue-500 text-white"
                : "text-gray-300 hover:text-gray-100 hover:bg-gray-600"
            }`}>
            CSS
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Template Dropdown */}
          {activeTab === "jsx" && (
            <select
              onChange={(e) => e.target.value && insertTemplate(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1"
              defaultValue="">
              <option value="">Insert Template</option>
              <option value="component">Basic Component</option>
              <option value="form">Form Component</option>
              <option value="card">Card Component</option>
            </select>
          )}

          {/* Format Button */}
          <button
            onClick={formatCode}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-600 rounded transition-colors"
            title="Format code (Ctrl+Shift+F)">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Clear Button */}
          <button
            onClick={clearCode}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
            title="Clear code">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              {isFullscreen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative bg-gray-900">
        {/* JSX Editor */}
        {activeTab === "jsx" && (
          <div className="h-full p-4 bg-gray-900">
            <textarea
              ref={jsxTextareaRef}
              value={jsxCode}
              onChange={handleJSXChange}
              onKeyDown={handleKeyDown}
              placeholder="// Start typing your React component here...
function GeneratedComponent() {
  return (
    <div>
      <h1>Hello World!</h1>
    </div>
  );
}"
              className="w-full h-full resize-none border-0 outline-none font-mono text-sm leading-relaxed bg-gray-900 text-gray-100 placeholder-gray-500 pl-14"
              style={{
                fontFamily: "'JetBrains Mono', 'Monaco', 'Menlo', monospace",
                minHeight: "300px",
              }}
            />
          </div>
        )}

        {/* CSS Editor */}
        {activeTab === "css" && (
          <div className="h-full p-4 bg-gray-900">
            <textarea
              ref={cssTextareaRef}
              value={cssCode}
              onChange={handleCSSChange}
              onKeyDown={handleKeyDown}
              placeholder="/* Add custom CSS styles here */
.custom-class {
  color: #333;
  padding: 1rem;
}

/* You can also use standard CSS or custom styles */
"
              className="w-full h-full resize-none border-0 outline-none font-mono text-sm leading-relaxed bg-gray-900 text-gray-100 placeholder-gray-500 pl-14"
              style={{
                fontFamily: "'JetBrains Mono', 'Monaco', 'Menlo', monospace",
                minHeight: "300px",
              }}
            />
          </div>
        )}

        {/* Line Numbers (Optional enhancement) */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-800 border-r border-gray-700 flex flex-col text-xs text-gray-500 font-mono pt-4 pointer-events-none">
          {(activeTab === "jsx" ? jsxCode : cssCode)
            .split("\n")
            .map((_, index) => (
              <div
                key={index + 1}
                className="h-6 flex items-center justify-end pr-2">
                {index + 1}
              </div>
            ))}
        </div>
      </div>

      {/* Editor Footer */}
      <div className="p-2 bg-gray-700 border-t border-gray-600 text-xs text-gray-400 flex justify-between items-center">
        <div>
          {activeTab === "jsx" ? "JavaScript/JSX" : "CSS"} •{" "}
          {(activeTab === "jsx" ? jsxCode : cssCode).split("\n").length} lines
        </div>
        <div className="flex items-center space-x-4">
          <span>Ctrl+Shift+F to format</span>
          <span>Tab to indent</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
