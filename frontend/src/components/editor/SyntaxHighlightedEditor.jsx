import React from "react";

const SyntaxHighlightedEditor = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className = "",
  style = {},
}) => {
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
    <div className={`relative w-full h-full bg-gray-900 ${className}`}>
      {/* Simple functional textarea - no overlay complications */}
      <textarea
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        style={editorStyles}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        data-gramm="false"
      />
    </div>
  );
};

export default SyntaxHighlightedEditor;
