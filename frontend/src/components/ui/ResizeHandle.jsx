import { useState } from "react";

const ResizeHandle = ({
  direction = "horizontal",
  onMouseDown,
  className = "",
  showTooltip = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isHorizontal = direction === "horizontal";

  return (
    <div
      className={`
        ${
          isHorizontal
            ? "w-px h-full cursor-col-resize"
            : "h-1 w-full cursor-row-resize"
        }
        bg-gray-600 
        hover:bg-blue-400 
        transition-all duration-200
        group
        relative
        flex-shrink-0
        ${isHovered ? "bg-blue-400 shadow-sm" : ""}
        ${className}
      `}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {/* Resize indicator and hover area */}
      <div
        className={`
        absolute 
        ${isHorizontal ? "inset-y-0 -inset-x-3" : "inset-x-0 -inset-y-3"}
        flex items-center justify-center 
        transition-opacity duration-200
        ${isHorizontal ? "cursor-col-resize" : "cursor-row-resize"}
      `}>
        {/* Visual indicator */}
        <div
          className={`
          ${isHorizontal ? "w-1 h-8" : "h-1 w-8"}
          bg-blue-500 rounded-full
          shadow-sm
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        `}></div>
      </div>

      {/* Tooltip */}
      {showTooltip && isHovered && (
        <div
          className={`
          absolute z-50 
          ${
            isHorizontal
              ? "left-2 top-1/2 -translate-y-1/2"
              : "top-2 left-1/2 -translate-x-1/2"
          }
          bg-gray-800 text-white text-xs px-2 py-1 rounded
          whitespace-nowrap
          pointer-events-none
        `}>
          Drag to resize
        </div>
      )}

      {/* Active resize indicator */}
      <div
        className={`
        absolute inset-0
        ${isHorizontal ? "border-l-2 border-r-2" : "border-t-2 border-b-2"}
        border-blue-500
        opacity-0
        transition-opacity duration-200
        ${isHovered ? "opacity-100" : ""}
      `}></div>
    </div>
  );
};

export default ResizeHandle;
