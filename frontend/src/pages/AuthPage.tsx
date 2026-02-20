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
      {/* Seigaiha pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pattern-seigaiha pointer-events-none" />

      {/* Sakura tree — top-right, flush with edge */}
      <div className="fixed right-0 top-0 pointer-events-none select-none w-[560px] md:w-[720px] opacity-55 dark:opacity-30">
        <img
          src="/sakura_tree.png"
          alt=""
          aria-hidden
          className="w-full h-auto object-contain"
          // style={{
          //   filter: "sepia(0.5) hue-rotate(298deg) saturate(2.2) brightness(1.15)",
          // }}
        />
      </div>

      {/* Vertical welcome text — left side */}
      <div className="fixed left-6 md:left-10 top-1/2 -translate-y-1/2 select-none pointer-events-none hidden md:block z-0">
        <p
          className="font-japanese font-bold text-7xl leading-none tracking-[0.25em]"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          <span className="bg-gradient-to-b from-primary via-primary/45 to-transparent bg-clip-text text-transparent">
            ようこそ
          </span>
        </p>
      </div>

      {/* Falling sakura petals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {petals.map((p, i) => (
          <SakuraPetal key={i} {...p} />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo and title */}
        <div className="mb-10 text-center animate-fade-in">
          <h1 className="font-display text-6xl md:text-7xl font-bold text-primary mb-3 tracking-tight">
            Animoji
          </h1>
          <p className="mt-3 text-sm text-slate-400 dark:text-slate-500 font-japanese tracking-widest">
            あなたの写真をアニメに変換
          </p>
        </div>

        {/* Auth card */}
        <Card className="w-full max-w-md border border-slate-200/60 dark:border-slate-700/40 shadow-2xl shadow-black/10 dark:shadow-black/50 backdrop-blur-md bg-white/95 dark:bg-paper-dark/95 animate-slide-up rounded-2xl overflow-hidden p-0">
          {/* Vermillion accent bar */}
          <div className="h-0.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

          <CardHeader className="space-y-2 text-center pt-8 pb-4">
            <CardTitle className="font-display text-3xl text-primary">
              Welcome
            </CardTitle>
            <CardDescription className="text-base font-japanese">
              サインインして始めましょう
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-8 pb-8">
            {/* Error message */}
            {error && (
              <div className="p-4 rounded-xl bg-primary/8 border border-primary/20 animate-fade-in">
                <p className="text-sm text-primary font-medium">{error}</p>
              </div>
            )}

            {/* Google OAuth button — light + dark mode */}
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-12 font-medium text-base bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-800 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-white dark:hover:text-white dark:border-slate-600/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-xl"
              variant="outline"
            >
              <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24">
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
                <div className="w-full border-t border-slate-200 dark:border-slate-700/60" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-white dark:bg-paper-dark px-3 text-muted-foreground">
                  Secure Authentication
                </span>
              </div>
            </div>

            {/* Info text */}
            <div className="text-center space-y-1">
              <p className="text-sm font-japanese text-muted-foreground">
                Googleアカウントで安全にログイン
              </p>
              <p className="text-xs text-muted-foreground/70">
                Transform your photos into anime-style art
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-10 text-center animate-fade-in">
          <p className="text-[11px] text-muted-foreground/60 font-japanese max-w-sm leading-relaxed">
            アカウントを作成すると、利用規約とプライバシーポリシーに同意したことになります
          </p>
        </div>
      </div>
    </div>
  );
}
