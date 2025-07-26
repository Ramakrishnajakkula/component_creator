import React, { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css"; // VS Code-like dark theme
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-css";

const SyntaxHighlightedEditor = ({
  value,
  onChange,
  onKeyDown,
  language = "jsx",
  placeholder,
  className = "",
  style = {},
}) => {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const containerRef = useRef(null);

  // Sync scroll between textarea and highlight
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Update syntax highlighting
  useEffect(() => {
    if (highlightRef.current && value) {
      const highlighted = Prism.highlight(
        value,
        Prism.languages[language] || Prism.languages.javascript,
        language
      );
      highlightRef.current.innerHTML = highlighted;
    } else if (highlightRef.current) {
      highlightRef.current.innerHTML = "";
    }
  }, [value, language]);

  const handleChange = (e) => {
    onChange(e);
  };

  const editorStyles = {
    fontFamily: "'JetBrains Mono', 'Monaco', 'Menlo', monospace",
    fontSize: "14px",
    lineHeight: "1.5",
    padding: "16px 16px 16px 56px",
    margin: 0,
    border: "none",
    outline: "none",
    background: "#1e1e1e",
    color: "#d4d4d4",
    resize: "none",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    ...style,
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-gray-900 overflow-hidden ${className}`}>
      {/* Syntax highlighted background */}
      <pre
        ref={highlightRef}
        className="absolute inset-0 overflow-auto pointer-events-none whitespace-pre-wrap break-words"
        style={{
          ...editorStyles,
          zIndex: 1,
          color: "inherit", // Let Prism handle colors
        }}
      />

      {/* Transparent textarea for input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onScroll={handleScroll}
        placeholder={placeholder}
        className="absolute inset-0"
        style={{
          ...editorStyles,
          background: "transparent",
          color: "transparent",
          caretColor: "#d4d4d4",
          zIndex: 2,
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
};

export default SyntaxHighlightedEditor;
