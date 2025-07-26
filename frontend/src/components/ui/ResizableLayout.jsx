import React, { useState, useRef, useEffect } from "react";
import ResizeHandle from "./ResizeHandle";

const ResizableLayout = ({
  panels,
  direction = "horizontal",
  className = "",
  minSizes = [],
  defaultSizes = [],
  onSizesChange,
}) => {
  const containerRef = useRef(null);
  const [sizes, setSizes] = useState(
    defaultSizes.length ? defaultSizes : panels.map(() => 100 / panels.length)
  );
  const [isResizing, setIsResizing] = useState(false);
  const [resizingIndex, setResizingIndex] = useState(-1);
  const [startMousePos, setStartMousePos] = useState(0);
  const [startSizes, setStartSizes] = useState([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || resizingIndex === -1) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isHorizontal = direction === "horizontal";
      const totalSize = isHorizontal ? rect.width : rect.height;
      const currentMousePos = isHorizontal
        ? e.clientX - rect.left
        : e.clientY - rect.top;

      // Calculate the difference from start position
      const mouseDelta = currentMousePos - startMousePos;
      const percentageDelta = (mouseDelta / totalSize) * 100;

      // Calculate new sizes based on the delta
      const newSizes = [...startSizes];
      const minSize1 = minSizes[resizingIndex] || 5;
      const minSize2 = minSizes[resizingIndex + 1] || 5;

      // Apply the delta to both panels (one grows, one shrinks)
      let newSize1 = startSizes[resizingIndex] + percentageDelta;
      let newSize2 = startSizes[resizingIndex + 1] - percentageDelta;

      // Constrain to minimum sizes
      if (newSize1 < minSize1) {
        const adjustment = minSize1 - newSize1;
        newSize1 = minSize1;
        newSize2 = startSizes[resizingIndex + 1] - percentageDelta + adjustment;
      }

      if (newSize2 < minSize2) {
        const adjustment = minSize2 - newSize2;
        newSize2 = minSize2;
        newSize1 = startSizes[resizingIndex] + percentageDelta - adjustment;
      }

      // Update the sizes
      newSizes[resizingIndex] = newSize1;
      newSizes[resizingIndex + 1] = newSize2;

      setSizes(newSizes);
      onSizesChange?.(newSizes);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingIndex(-1);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor =
        direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isResizing,
    resizingIndex,
    sizes,
    direction,
    minSizes,
    onSizesChange,
    startMousePos,
    startSizes,
  ]);

  const handleResizeStart = (index, e) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const isHorizontal = direction === "horizontal";
    const currentMousePos = isHorizontal
      ? e.clientX - rect.left
      : e.clientY - rect.top;

    setIsResizing(true);
    setResizingIndex(index);
    setStartMousePos(currentMousePos);
    setStartSizes([...sizes]);
  };

  const isHorizontal = direction === "horizontal";

  return (
    <div
      ref={containerRef}
      className={`flex ${
        isHorizontal ? "flex-row" : "flex-col"
      } h-full w-full ${className}`}>
      {panels.map((panel, index) => (
        <React.Fragment key={`panel-${index}`}>
          {/* Panel Content */}
          <div
            className={`overflow-hidden ${isHorizontal ? "h-full" : "w-full"}`}
            style={{
              [isHorizontal ? "width" : "height"]: `${sizes[index]}%`,
            }}>
            {panel.content}
          </div>

          {/* Resize Handle */}
          {index < panels.length - 1 && (
            <ResizeHandle
              direction={direction}
              onMouseDown={(e) => handleResizeStart(index, e)}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ResizableLayout;
