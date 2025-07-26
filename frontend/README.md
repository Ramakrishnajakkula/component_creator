# Component Generator Frontend

React frontend application for the AI-driven component generator platform.

## Features

- **Authentication**: Login/Register with JWT tokens
- **Dashboard**: Overview of sessions and quick actions
- **Session Management**: Create and manage component sessions
- **State Management**: Redux Toolkit for application state
- **Responsive Design**: Tailwind CSS for modern UI

## Tech Stack

- **React 18** - UI library
- **Vite** - Fast build tool and dev server
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend server running on http://localhost:5000

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
# Update VITE_API_URL if backend is running on different port
```

3. Start development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   └── layout/         # Layout components
├── pages/              # Page components
├── store/              # Redux store and slices
│   └── slices/         # Redux slices
├── services/           # API services
├── App.jsx             # Main app component
└── main.jsx            # App entry point
```

## State Management

The application uses Redux Toolkit with the following slices:

- **authSlice**: User authentication and profile
- **sessionSlice**: Session management
- **chatSlice**: AI chat and component generation
- **editorSlice**: Code editor state and settings

## API Integration

The frontend communicates with the backend API using Axios with:

- Automatic token attachment
- Token refresh handling
- Request/response interceptors
- Error handling

## Authentication

- JWT-based authentication
- Automatic token refresh
- Protected routes
- Persistent login state

## UI Components

Built with Tailwind CSS utility classes:

- Responsive design (mobile-first)
- Custom color palette
- Reusable component classes
- Dark mode support (planned)

## Week 2 Implementation Status

### ✅ Completed Features

- React app setup with Vite
- Redux Toolkit state management
- React Router routing
- Tailwind CSS styling
- Authentication flow (Login/Register)
- Protected routes
- Main layout with header/sidebar
- Dashboard page
- API service integration

### 📋 Redux Slices

- **Auth Slice**: User authentication, login, register, profile
- **Session Slice**: Session CRUD, current session state
- **Chat Slice**: AI interactions, message history
- **Editor Slice**: Code editor state, settings, history

### 🎨 UI Components

- Login/Register forms with validation
- Header with user menu
- Sidebar with session navigation
- Dashboard with stats and recent sessions
- Responsive layout for all screen sizes

## Next Steps (Week 3)

- Chat interface implementation
- Component preview iframe
- Real-time AI interactions
- Code editor integration
- Session detail view
