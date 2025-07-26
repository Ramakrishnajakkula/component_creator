import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchSessions,
  createSession,
  setCurrentSession,
} from "../store/slices/sessionSlice";
import MainLayout from "../components/layout/MainLayout";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sessions, isLoading } = useSelector((state) => state.sessions);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

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
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleSessionClick = (session) => {
    dispatch(setCurrentSession(session));
    navigate(`/session/${session.id}`);
  };

  return (
    <MainLayout>
      <div className="p-6">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Create amazing React components with AI assistance
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-primary-600"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Sessions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {sessions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Components Created
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {sessions.filter((s) => s.componentCode?.jsx).length}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  AI Interactions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {sessions.reduce(
                    (total, session) =>
                      total + (session.stats?.messagesCount || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent sessions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Sessions
            </h2>
            <button onClick={handleCreateSession} className="btn btn-primary">
              Create New Component
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
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
              <h3
                key="empty-title"
                className="mt-4 text-lg font-medium text-gray-900">
                No sessions yet
              </h3>
              <p key="empty-subtitle" className="mt-2 text-gray-500">
                Get started by creating your first component
              </p>
              <button
                key="empty-action"
                onClick={handleCreateSession}
                className="mt-4 btn btn-primary">
                Create Your First Component
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.slice(0, 6).map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionClick(session)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-gray-900 truncate">
                      {session.name || "Untitled Session"}
                    </h3>
                    <span
                      className={`
                      inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                      ${
                        session.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    `}>
                      {session.status || "active"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {session.description || "No description available"}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span key="framework-info">
                      {session.metadata?.framework && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {session.metadata.framework}
                        </span>
                      )}
                    </span>
                    <span key="date-info">
                      {new Date(
                        session.updatedAt || session.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Start
            </h3>
            <div className="space-y-3">
              <button
                key="create-button"
                onClick={handleCreateSession}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded">
                    <svg
                      className="h-4 w-4 text-blue-600"
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
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">
                      Create Button Component
                    </p>
                    <p className="text-sm text-gray-500">
                      Start with a simple button
                    </p>
                  </div>
                </div>
              </button>

              <button
                key="create-card"
                onClick={handleCreateSession}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded">
                    <svg
                      className="h-4 w-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">
                      Create Card Component
                    </p>
                    <p className="text-sm text-gray-500">
                      Build a content card
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Resources
            </h3>
            <div className="space-y-3">
              <a
                key="documentation"
                href="#"
                className="block p-3 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded">
                    <svg
                      className="h-4 w-4 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Documentation</p>
                    <p className="text-sm text-gray-500">
                      Learn how to use the platform
                    </p>
                  </div>
                </div>
              </a>

              <a
                key="help-support"
                href="#"
                className="block p-3 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded">
                    <svg
                      className="h-4 w-4 text-yellow-600"
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
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Help & Support</p>
                    <p className="text-sm text-gray-500">
                      Get help when you need it
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
