import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLoading, loginSuccess, loginFailure } from "@store/slices/authSlice";
import { authService } from "@services/authService";
import { useAppSelector } from "@hooks/redux";

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(setLoading(true));
    authService
      .getMe()
      .then((user) => {
        dispatch(loginSuccess({ user }));
      })
      .catch(() => {
        dispatch(loginFailure("Not authenticated"));
      });
  }, [dispatch]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
