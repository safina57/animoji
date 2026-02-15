import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@hooks/redux";
import { loginSuccess, loginFailure, setLoading } from "@store/slices/authSlice";
import { authService } from "@services/authService";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        dispatch(setLoading(true));
        const user = await authService.getMe();
        dispatch(loginSuccess({ user }));
        navigate("/create");
      } catch (error) {
        console.error("Failed to fetch user:", error);
        dispatch(loginFailure("Failed to authenticate"));
        navigate("/auth");
      }
    };

    fetchUser();
  }, [dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="font-japanese text-stone-gray dark:text-stone-light">
          認証中...
        </p>
      </div>
    </div>
  );
}
