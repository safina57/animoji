import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLoading, loginSuccess, loginFailure } from "@store/slices/authSlice";
import { authService } from "@services/authService";

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useDispatch();

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

  return <>{children}</>;
}
