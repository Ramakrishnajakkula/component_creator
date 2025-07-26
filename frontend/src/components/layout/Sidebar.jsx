import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  createSession,
  setCurrentSession,
} from "../../store/slices/sessionSlice";

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { sessions, currentSession } = useSelector((state) => state.sessions);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleCreateSession = async () => {
    try {
      const sessionData = {
        name: `New Component ${sessions.length + 1}`,
        description: "A new component session",
        metadata: {
          framework: "react",
          styling: "css",
        },
      };

      const result = await dispatch(createSession(sessionData));
      if (result.type === "sessions/createSession/fulfilled") {
        navigate(`/session/${result.payload.id}`);
        closeSidebar();
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleSessionClick = (session) => {
    dispatch(setCurrentSession(session));
    navigate(`/session/${session.id}`);
    closeSidebar();
  };

  return (
    <div>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          key="mobile-overlay"
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        key="sidebar"
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleCreateSession}
              className="w-full btn btn-primary flex items-center justify-center space-x-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>New Component</span>
            </button>
          </div>

          {/* Sessions list */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Recent Sessions
              </h3>

              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    key="empty-icon"
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p key="empty-title" className="mt-2 text-sm text-gray-500">
                    No sessions yet
                  </p>
                  <p key="empty-subtitle" className="text-xs text-gray-400">
                    Create your first component to get started
                  </p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-colors border
                      ${
                        currentSession?.id === session.id
                          ? "bg-primary-50 border-primary-200 text-primary-900"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900"
                      }
                    `}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">
                          {session.name || "Untitled Session"}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {session.description || "No description"}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span
                            key="status-badge"
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {session.status || "active"}
                          </span>
                          {session.metadata?.framework && (
                            <span
                              key="framework-badge"
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {session.metadata.framework}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle session options
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Need help? Check our docs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
