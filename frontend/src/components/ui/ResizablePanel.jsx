import { useState, useEffect, useRef } from "react";

const ResizablePanel = ({
  children,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 600,
  direction = "right",
  className = "",
  onResize,
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef(null);
  const resizerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const panel = panelRef.current;
      if (!panel) return;

      const rect = panel.getBoundingClientRect();
      let newWidth;

      if (direction === "right") {
        newWidth = e.clientX - rect.left;
      } else {
        newWidth = rect.right - e.clientX;
      }

      // Constrain within min/max bounds
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      setWidth(newWidth);
      onResize?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, direction, minWidth, maxWidth, onResize]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  return (
    <div
      ref={panelRef}
      className={`relative flex ${className}`}
      style={{ width: `${width}px` }}>
      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Resize Handle */}
      <div
        ref={resizerRef}
        className={`
          ${direction === "right" ? "border-r-2" : "border-l-2"} 
          border-transparent hover:border-blue-400 
          cursor-col-resize 
          w-1 
          bg-gray-600 
          hover:bg-blue-400 
          transition-colors 
          group
          relative
        `}
        onMouseDown={handleMouseDown}>
        {/* Resize indicator */}
        <div className="absolute inset-y-0 -inset-x-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-1 h-8 bg-blue-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ResizablePanel;
