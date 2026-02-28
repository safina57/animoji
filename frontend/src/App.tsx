import { lazy, Suspense } from "react"
import { Provider } from "react-redux"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { store } from "@store/store"
import Navbar from "@lib/layout/Navbar"
import { ProtectedRoute } from "@components/auth/ProtectedRoute"
import { AuthInitializer } from "@components/auth/AuthInitializer"

const LandingPage = lazy(() => import("@pages/LandingPage"))
const CommunityPage = lazy(() => import("@pages/CommunityPage"))
const CreatePage = lazy(() => import("@pages/CreatePage"))
const GalleryPage = lazy(() => import("@pages/GalleryPage"))
const AuthPage = lazy(() => import("@pages/AuthPage"))
const AuthCallbackPage = lazy(() => import("@pages/AuthCallbackPage"))
const NotFoundPage = lazy(() => import("@pages/NotFoundPage"))

function PageFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppShell() {
  const { pathname } = useLocation()
  const isLanding = pathname === "/"

  if (isLanding) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      <Navbar />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <GalleryPage />
              </ProtectedRoute>
            }
          />
          <Route path="/notfound" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/notfound" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthInitializer>
          <AppShell />
        </AuthInitializer>
      </BrowserRouter>
    </Provider>
  )
}
