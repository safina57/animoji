import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { authService } from "@services/authService"
import { useAppSelector } from "@hooks/redux"
import { Button } from "@lib/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lib/ui/card"
import FallingPetals from "@lib/decorations/FallingPetals/FallingPetals"
import GoogleLogo from "@components/auth/GoogleLogo"
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay"

export default function AuthPage() {
  const { isAuthenticated, error } = useAppSelector((state) => state.auth)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/create")
    }
  }, [isAuthenticated, navigate])

  const handleGoogleLogin = () => {
    authService.loginWithGoogle()
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-500">
      {/* Seigaiha pattern overlay */}
      <SeigaihaOverlay className="absolute opacity-[0.04] dark:opacity-[0.08]" />

      {/* Sakura tree — top-right, flush with edge */}
      <div className="fixed right-0 top-0 pointer-events-none select-none w-[560px] md:w-[720px] opacity-55 dark:opacity-30">
        <img src="/sakura_tree.png" alt="" aria-hidden className="w-full h-auto object-contain" />
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
      <FallingPetals count={14} />

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
            <CardTitle className="font-display text-3xl text-primary">Welcome</CardTitle>
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
              <GoogleLogo className="w-5 h-5 mr-3 shrink-0" />
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
  )
}
