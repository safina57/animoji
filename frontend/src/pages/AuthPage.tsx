import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@services/authService";
import { useAppSelector } from "@hooks/redux";
import { Button } from "@lib/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lib/ui/card";
import SakuraPetal, { type PetalProps } from "@lib/decorations/SakuraPetal/SakuraPetal";

export default function AuthPage() {
  const { isAuthenticated, error } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/create");
    }
  }, [isAuthenticated, navigate]);

  const petals = useMemo<PetalProps[]>(() => {
    const sizes: PetalProps["size"][] = ["small", "medium", "large"];
    return Array.from({ length: 14 }, () => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 6}s`,
      duration: `${8 + Math.random() * 5}s`,
      size: sizes[Math.floor(Math.random() * sizes.length)],
    }));
  }, []);

  const handleGoogleLogin = () => {
    authService.loginWithGoogle();
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-500">
      {/* Decorative background patterns */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 pattern-seigaiha" />

      {/* Falling sakura petals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {petals.map((p, i) => (
          <SakuraPetal key={i} {...p} />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo and title */}
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="font-display text-6xl md:text-7xl font-bold text-primary mb-4 tracking-tight">
            絵文字
          </h1>
          <p className="font-display text-2xl md:text-3xl text-stone-gray dark:text-slate-300 italic">
            Animoji
          </p>
          <p className="mt-4 text-stone-gray/80 dark:text-slate-300/70 font-japanese">
            あなたの写真をアニメに変換
          </p>
        </div>

        {/* Auth card */}
        <Card className="w-full max-w-md japanese-frame shadow-2xl backdrop-blur-sm bg-white/90 dark:bg-paper-dark/90 animate-slide-up">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="font-display text-3xl text-primary">
              Welcome
            </CardTitle>
            <CardDescription className="text-base font-japanese">
              サインインして始めましょう
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 animate-fade-in">
                <p className="text-sm text-primary dark:text-primary font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Google OAuth button */}
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-12 font-medium text-base bg-white hover:bg-gray-50 text-gray-900 border-2 border-stone-gray/20 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              variant="outline"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Decorative divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-gray/20 dark:border-stone-light/20"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-paper-dark px-2 text-stone-gray/60 dark:text-slate-400">
                  Secure Authentication
                </span>
              </div>
            </div>

            {/* Info text */}
            <div className="text-center text-sm text-stone-gray/70 dark:text-slate-300/60 space-y-1">
              <p className="font-japanese">
                Googleアカウントで安全にログイン
              </p>
              <p className="text-xs">
                Transform your photos into anime-style art
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-stone-gray/60 dark:text-slate-300/50 animate-fade-in">
          <p className="font-japanese">
            アカウントを作成すると、利用規約とプライバシーポリシーに同意したことになります
          </p>
        </div>
      </div>

      {/* Decorative corner elements */}
      <div className="fixed top-0 left-0 w-32 h-32 opacity-20 dark:opacity-10">
        <svg viewBox="0 0 100 100" className="text-primary fill-current">
          <path d="M0,0 L100,0 L100,20 C80,20 60,10 40,10 C20,10 10,20 0,20 Z" />
          <path d="M0,0 L20,0 C20,20 10,40 10,60 C10,80 20,90 20,100 L0,100 Z" />
        </svg>
      </div>
      <div className="fixed bottom-0 right-0 w-32 h-32 opacity-20 dark:opacity-10 rotate-180">
        <svg viewBox="0 0 100 100" className="text-primary fill-current">
          <path d="M0,0 L100,0 L100,20 C80,20 60,10 40,10 C20,10 10,20 0,20 Z" />
          <path d="M0,0 L20,0 C20,20 10,40 10,60 C10,80 20,90 20,100 L0,100 Z" />
        </svg>
      </div>
    </div>
  );
}
