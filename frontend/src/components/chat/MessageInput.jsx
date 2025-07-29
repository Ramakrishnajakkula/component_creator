import { useState, useRef } from "react";
import ImagePreview from "./ImagePreview";
import { debugImageProcessing } from "../../utils/imageUtils";

const MessageInput = ({ onSendMessage, isLoading, placeholder }) => {
  const [message, setMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((message.trim() || selectedImages.length > 0) && !isLoading) {
      // Debug images before sending
      if (selectedImages.length > 0) {
        debugImageProcessing(selectedImages);
      }

      onSendMessage({
        content: message.trim(),
        images: selectedImages,
      });
      setMessage("");
      setSelectedImages([]);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
    ];

    const validFiles = files.filter((file) => {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        alert(
          `${file.name} is not a supported image format. Please use PNG, JPEG, GIF, or WebP.`
        );
        return false;
      }

      // Check file size
      if (file.size > maxFileSize) {
        alert(`${file.name} is too large. Maximum file size is 5MB.`);
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      const remainingSlots = 5 - selectedImages.length;
      const filesToProcess = validFiles.slice(0, remainingSlots);

      if (validFiles.length > remainingSlots) {
        alert(
          `You can only upload ${remainingSlots} more image(s). First ${remainingSlots} valid images will be added.`
        );
      }

      // Convert images to base64 for preview and sending
      Promise.all(
        filesToProcess.map((file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                file,
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: e.target.result,
                base64: e.target.result.split(",")[1], // Remove data:image/...;base64, prefix
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      )
        .then((processedImages) => {
          setSelectedImages((prev) => [...prev, ...processedImages]);
        })
        .catch((error) => {
          console.error("Error processing images:", error);
          alert("Failed to process some images. Please try again.");
        });
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length > 0) {
      // Create a mock event object to use existing handleImageSelect logic
      const mockEvent = {
        target: {
          files: imageFiles,
        },
      };
      handleImageSelect(mockEvent);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}>
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center z-10">
          <div className="text-blue-600 font-medium">Drop images here</div>
        </div>
      )}
      {/* Image Preview Section */}
      {selectedImages.length > 0 && (
        <div className="mb-3 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Selected Images ({selectedImages.length}/5)
            </span>
            {selectedImages.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedImages([])}
                className="text-sm text-red-600 hover:text-red-700 transition-colors">
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {selectedImages.map((image, index) => (
              <ImagePreview
                key={index}
                image={image}
                onRemove={() => removeImage(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="flex space-x-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Image upload button */}
        <div className="relative">
          <button
            type="button"
            onClick={openFileDialog}
            disabled={isLoading || selectedImages.length >= 5}
            className={`px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              selectedImages.length > 0
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-600 text-white hover:bg-gray-700"
            }`}
            title={
              selectedImages.length >= 5
                ? "Maximum 5 images allowed"
                : "Upload images (PNG, JPG, JPEG, GIF, WebP)"
            }>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
          {selectedImages.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedImages.length}
            </span>
          )}
        </div>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder || "Type your message..."}
          disabled={isLoading}
          className="flex-1 px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={
            (!message.trim() && selectedImages.length === 0) || isLoading
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {isLoading ? (
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            "Send"
          )}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
