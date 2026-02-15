import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { store } from "@store/store";
import Navbar from "@lib/layout/Navbar";
import CommunityPage from "@pages/CommunityPage";
import CreatePage from "@pages/CreatePage";
import NotFoundPage from "@pages/NotFoundPage";
import AuthPage from "@pages/AuthPage";
import AuthCallbackPage from "@pages/AuthCallbackPage";
import { ProtectedRoute } from "@components/auth/ProtectedRoute";
import { AuthInitializer } from "@components/auth/AuthInitializer";

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthInitializer>
          <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
            <Navbar />
            <Routes>
              <Route path="/" element={<CommunityPage />} />
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
              <Route path="/notfound" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/notfound" replace />} />
            </Routes>
          </div>
        </AuthInitializer>
      </BrowserRouter>
    </Provider>
  );
}
