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
    const token = localStorage.getItem("auth_token");
    if (token) {
      dispatch(setLoading(true));
      authService
        .getMe(token)
        .then((user) => {
          dispatch(loginSuccess({ user, token }));
        })
        .catch(() => {
          dispatch(loginFailure("Session expired"));
          localStorage.removeItem("auth_token");
        });
    }
  }, [dispatch]);

  return <>{children}</>;
}
