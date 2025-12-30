import { useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { HomePage } from "./pages/home"
import { LoginPage } from "./pages/login"
import { SignupPage } from "./pages/signup"
import { DashboardPage } from "./pages/dashboard"
import { CalendarsPage } from "./pages/calendars"
import { useAuthStore } from "./stores/auth-store"

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()

  // If not authenticated, redirect to home page
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Public route wrapper (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  const { logout } = useAuthStore()

  useEffect(() => {
    // Listen for unauthorized events
    const handleUnauthorized = () => {
      logout()
      // Redirect to home page if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [logout])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/calendars"
          element={
            <ProtectedRoute>
              <CalendarsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
