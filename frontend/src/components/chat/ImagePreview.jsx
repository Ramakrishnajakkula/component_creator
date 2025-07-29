import { useState } from "react";

const ImagePreview = ({ image, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <div className="relative group bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        {/* Image */}
        <div className="aspect-square relative">
          <img
            src={image.dataUrl}
            alt={image.name}
            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setIsExpanded(true)}
          />

          {/* Remove button */}
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Remove image">
            ×
          </button>

          {/* Image info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <div className="text-white text-xs truncate">{image.name}</div>
            <div className="text-white/80 text-xs">
              {formatFileSize(image.size)}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded view modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute -top-10 right-0 text-white text-xl hover:text-gray-300">
              ✕ Close
            </button>
            <img
              src={image.dataUrl}
              alt={image.name}
              className="max-w-full max-h-full object-contain rounded"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 rounded-b">
              <div className="font-medium">{image.name}</div>
              <div className="text-sm opacity-80">
                {formatFileSize(image.size)} • {image.type}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImagePreview;
