import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import {
  sendMessage,
  clearError,
  generateComponent,
  selectChatMessages,
  selectChatLoading,
  selectChatError,
} from "../../store/slices/chatSlice";

const ChatPanel = ({ sessionId }) => {
  const dispatch = useDispatch();
  const messages = useSelector(selectChatMessages);
  const isLoading = useSelector(selectChatLoading);
  const error = useSelector(selectChatError);
  const { currentSession } = useSelector((state) => state.sessions);

  const [isExpanded, setIsExpanded] = useState(true);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear error when component mounts
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleSendMessage = async (messageData) => {
    if (!sessionId) {
      console.error("No session ID provided");
      return;
    }

    // Debug logging
    console.log("Sending message with sessionId:", sessionId);
    console.log("SessionId type:", typeof sessionId);
    console.log("MessageData:", messageData);

    try {
      // Send user message
      await dispatch(
        sendMessage({
          sessionId,
          content: messageData.content,
          type: "user",
          metadata: messageData.metadata,
        })
      );

      // Always trigger AI component generation for user messages
      console.log("Generating component for session:", sessionId);
      await dispatch(
        generateComponent({
          sessionId,
          prompt: messageData.content,
          images: messageData.images || [],
        })
      );
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleRetry = () => {
    dispatch(clearError());
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="flex flex-col bg-white h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="transition-opacity duration-300">
          <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
          <p className="text-sm text-gray-500">
            {currentSession?.title || "New Session"}
          </p>
        </div>

        <button
          onClick={toggleExpanded}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title={isExpanded ? "Minimize chat" : "Maximize chat"}>
          <svg
            className={`h-5 w-5 transition-transform duration-300 ${
              isExpanded ? "rotate-0" : "rotate-180"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Chat Content */}
      {isExpanded && (
        <>
          {/* Error Display */}
          {error && (
            <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 underline">
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <MessageList
              messages={messages}
              isLoading={isLoading}
              sessionId={sessionId}
            />
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200">
            <MessageInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder="Describe the component you want to create..."
            />
          </div>
        </>
      )}

      {/* Collapsed State Indicator */}
      {!isExpanded && (
        <div className="flex-1 flex items-center justify-center">
          <div className="rotate-90 text-sm text-gray-500 whitespace-nowrap">
            Chat
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
