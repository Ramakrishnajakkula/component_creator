import { useState } from "react";

const PanelControls = ({
  onResetSizes,
  onEqualSizes,
  currentLayout,
  onLayoutChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const layouts = [
    { key: "three-column", label: "Three Columns", icon: "⋮⋮⋮" },
    { key: "two-column", label: "Two Columns", icon: "⋮⋮" },
    { key: "preview-only", label: "Preview Only", icon: "⋮▢" },
  ];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
        title="Panel Controls">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-600 z-50">
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-100 mb-3">
                Panel Controls
              </h3>

              {/* Layout Selection */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-300 mb-2 block">
                  Layout
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {layouts.map((layout) => (
                    <button
                      key={layout.key}
                      onClick={() => {
                        onLayoutChange(layout.key);
                        setIsOpen(false);
                      }}
                      className={`
                        flex items-center space-x-2 px-3 py-2 text-left text-sm rounded
                        transition-colors w-full
                        ${
                          currentLayout === layout.key
                            ? "bg-blue-900 text-blue-200 border border-blue-700"
                            : "hover:bg-gray-700 text-gray-300"
                        }
                      `}>
                      <span className="font-mono text-xs">{layout.icon}</span>
                      <span>{layout.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Controls */}
              <div className="border-t border-gray-600 pt-3">
                <label className="text-xs font-medium text-gray-300 mb-2 block">
                  Panel Sizes
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      onEqualSizes();
                      setIsOpen(false);
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors">
                    Equal
                  </button>
                  <button
                    onClick={() => {
                      onResetSizes();
                      setIsOpen(false);
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors">
                    Reset
                  </button>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="border-t border-gray-600 pt-3 mt-3">
                <h4 className="text-xs font-medium text-gray-300 mb-2">
                  Shortcuts
                </h4>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Equal panels</span>
                    <kbd className="px-1 bg-gray-700 rounded">Ctrl+E</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Reset panels</span>
                    <kbd className="px-1 bg-gray-700 rounded">Ctrl+R</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Toggle layout</span>
                    <kbd className="px-1 bg-gray-700 rounded">Ctrl+L</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PanelControls;
