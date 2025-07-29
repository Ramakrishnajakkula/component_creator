import { useState } from "react";
import { useDispatch } from "react-redux";
import { copyToClipboard } from "../../utils/clipboard";
import { formatTimestamp } from "../../utils/dateUtils";
import { retryMessage } from "../../store/slices/chatSlice";
import LoadingDots from "../ui/LoadingDots";

const MessageList = ({ messages, isLoading, sessionId }) => {
  const dispatch = useDispatch();
  const [copiedId, setCopiedId] = useState(null);

  // Ensure messages is always an array to prevent .map errors
  const safeMessages = Array.isArray(messages) ? messages : [];

  const handleCopyCode = async (code, messageId) => {
    try {
      await copyToClipboard(code);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  const handleRetryMessage = (messageId) => {
    dispatch(retryMessage({ sessionId, messageId }));
  };

  const renderMessage = (message) => {
    const isUser = message.type === "user";
    const isSystem = message.type === "system";
    const isError = message.status === "error";

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div className={`max-w-[85%] ${isUser ? "order-2" : "order-1"}`}>
          {/* Message Header */}
          <div
            className={`flex items-center mb-1 ${
              isUser ? "justify-end" : "justify-start"
            }`}>
            <div
              className={`flex items-center space-x-2 ${
                isUser ? "flex-row-reverse space-x-reverse" : ""
              }`}>
              {/* Avatar */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isUser
                    ? "bg-blue-500 text-white"
                    : isSystem
                    ? "bg-purple-500 text-white"
                    : "bg-gray-500 text-white"
                }`}>
                {isUser ? "U" : isSystem ? "S" : "AI"}
              </div>

              {/* Timestamp */}
              <span className="text-xs text-gray-400">
                {formatTimestamp(message.timestamp)}
              </span>
            </div>
          </div>

          {/* Message Content */}
          <div
            className={`rounded-lg px-4 py-3 ${
              isUser
                ? "bg-blue-500 text-white"
                : isError
                ? "bg-red-900 border border-red-700 text-red-200"
                : "bg-gray-700 text-gray-100"
            }`}>
            {/* Text Content */}
            {message.content && (
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}

            {/* Code Content */}
            {message.code && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-medium ${
                      isUser ? "text-blue-100" : "text-gray-300"
                    }`}>
                    Generated Component
                  </span>
                  <button
                    onClick={() => handleCopyCode(message.code, message.id)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      isUser
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-600 hover:bg-gray-500 text-gray-200"
                    }`}>
                    {copiedId === message.id ? "✓ Copied" : "Copy Code"}
                  </button>
                </div>

                <pre
                  className={`text-sm rounded p-3 overflow-x-auto ${
                    isUser
                      ? "bg-blue-600 text-blue-100"
                      : "bg-gray-800 text-gray-100"
                  }`}>
                  <code>{message.code}</code>
                </pre>
              </div>
            )}

            {/* CSS Content */}
            {message.css && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-medium ${
                      isUser ? "text-blue-100" : "text-gray-600"
                    }`}>
                    Component CSS
                  </span>
                  <button
                    onClick={() =>
                      handleCopyCode(message.css, `${message.id}-css`)
                    }
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      isUser
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}>
                    {copiedId === `${message.id}-css` ? "✓ Copied" : "Copy CSS"}
                  </button>
                </div>

                <pre
                  className={`text-sm rounded p-3 overflow-x-auto ${
                    isUser
                      ? "bg-blue-600 text-blue-100"
                      : "bg-gray-800 text-gray-100"
                  }`}>
                  <code>{message.css}</code>
                </pre>
              </div>
            )}

            {/* Images */}
            {message.images && message.images.length > 0 && (
              <div className="mt-3 space-y-2">
                <div
                  className={`text-sm font-medium mb-2 ${
                    isUser ? "text-blue-100" : "text-gray-300"
                  }`}>
                  Attached Images ({message.images.length})
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {message.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.dataUrl || image.url}
                        alt={image.name || `Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          // Open image in new tab for larger view
                          window.open(image.dataUrl || image.url, "_blank");
                        }}
                      />
                      <div
                        className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b truncate ${
                          isUser ? "text-blue-100" : "text-gray-100"
                        }`}>
                        {image.name}{" "}
                        {image.size && `(${(image.size / 1024).toFixed(1)} KB)`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Component Preview */}
            {message.component && (
              <div className="mt-3">
                <div
                  className={`text-sm font-medium mb-2 ${
                    isUser ? "text-blue-100" : "text-gray-600"
                  }`}>
                  Component Information
                </div>
                <div className="bg-white rounded border p-4 text-gray-800">
                  {message.component.preview ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: message.component.preview,
                      }}
                    />
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <strong>Component Type:</strong> React Functional
                        Component
                      </div>
                      {message.component.dependencies &&
                        message.component.dependencies.length > 0 && (
                          <div>
                            <strong>Dependencies:</strong>{" "}
                            {message.component.dependencies.join(", ")}
                          </div>
                        )}
                      <div className="text-sm text-gray-600">
                        💡 Use the "Copy Code" button above to get the component
                        code for your project.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Actions */}
            {isError && (
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => handleRetryMessage(message.id)}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded transition-colors">
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Welcome Message */}
      {safeMessages.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to AI Component Generator
          </h3>
          <p className="text-gray-600 max-w-sm mx-auto">
            Describe the React component you want to create, or upload an image
            for reference. I'll generate the code for you!
          </p>
        </div>
      )}

      {/* Messages */}
      {safeMessages.map(renderMessage)}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-start mb-4">
          <div className="max-w-[85%]">
            <div className="flex items-center mb-1">
              <div className="w-6 h-6 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs font-medium mr-2">
                AI
              </div>
              <span className="text-xs text-gray-500">Generating...</span>
            </div>

            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <LoadingDots />
                <span className="text-sm text-gray-600">
                  Creating your component...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
