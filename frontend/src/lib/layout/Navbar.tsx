import { useState, useEffect } from "react"
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "@hooks/redux"
import { logout } from "@store/slices/authSlice"
import { authService } from "@services/authService"
import { Button } from "@lib/ui/button"
import SeigaihaOverlay from "@lib/decorations/SeigaihaOverlay/SeigaihaOverlay"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@lib/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@lib/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@lib/ui/sheet"

const NAV_LINKS = [
  { to: "/community", label: "Community", icon: "group" },
  { to: "/create", label: "Create", icon: "auto_fix_high" },
  { to: "/gallery", label: "Gallery", icon: "photo_library" },
] as const

export default function Navbar() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme")
    if (stored) return stored === "dark"
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("theme", dark ? "dark" : "light")
  }, [dark])

  const handleLogout = async () => {
    try {
      await authService.logout()
      dispatch(logout())
      navigate("/")
    } catch {
      dispatch(logout())
      navigate("/")
    }
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "text-primary"
      : "hover:text-primary transition-colors text-slate-600 dark:text-slate-400"

  return (
    <nav className="border-b border-primary/10 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: logo + desktop links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-primary text-3xl font-display font-bold tracking-tight">
              Animoji
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide uppercase">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === "/community"} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right: dark toggle + user menu + mobile hamburger */}
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDark((d) => !d)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center"
            aria-label="Toggle dark mode"
          >
            {dark ? (
              <span className="material-symbols-outlined text-yellow-400">light_mode</span>
            ) : (
              <span className="material-symbols-outlined">dark_mode</span>
            )}
          </button>

          {/* User menu — desktop */}
          <div className="hidden md:flex items-center">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full border-2 border-primary/20 hover:border-primary/40 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <Avatar>
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback className="bg-primary/10">
                        <span className="material-symbols-outlined text-primary text-lg">
                          person
                        </span>
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 p-0 bg-paper-light dark:bg-paper-dark paper-texture bg-cover bg-center border border-primary/10 shadow-xl shadow-primary/5 overflow-hidden rounded-xl"
                >
                  {/* Top accent bar */}
                  <div className="h-0.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                  {/* Seigaiha overlay */}
                  <SeigaihaOverlay className="absolute opacity-60 dark:opacity-25" />

                  <DropdownMenuLabel className="relative font-normal px-4 py-3 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                        <AvatarFallback className="bg-primary/10">
                          <span className="material-symbols-outlined text-primary text-sm">
                            person
                          </span>
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <div className="relative p-2">
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer rounded-lg px-3 py-2.5 text-primary hover:bg-primary/8 dark:hover:bg-primary/12 data-[highlighted]:bg-primary/8 dark:data-[highlighted]:bg-primary/12 data-[highlighted]:text-primary focus:bg-primary/8"
                    >
                      <span className="material-symbols-outlined text-[18px] mr-2">logout</span>
                      <span className="text-xs font-semibold uppercase tracking-wide">Logout</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => {
                  if (location.pathname !== "/login") navigate("/login")
                }}
                variant="outline"
                className="h-8 px-4 text-sm border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary"
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center"
                aria-label="Open menu"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-72 p-0 bg-paper-light dark:bg-paper-dark paper-texture bg-cover bg-center border-r-0 flex flex-col overflow-hidden"
            >
              {/* Seigaiha pattern overlay — matches ImageDetailDialog panel */}
              <div className="absolute inset-0 pattern-seigaiha opacity-60 dark:opacity-25 pointer-events-none" />

              {/* Top accent bar */}
              <div className="relative h-0.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 shrink-0" />

              <SheetHeader className="relative px-6 pt-6 pb-5 border-b border-primary/10">
                <SheetTitle className="text-left">
                  <span className="text-primary text-2xl font-display font-bold tracking-tight">
                    Animoji
                  </span>
                </SheetTitle>
                <p className="text-[10px] font-japanese text-muted-foreground tracking-widest text-left mt-0.5">
                  あなたの写真をアニメに変換
                </p>
              </SheetHeader>

              {/* Nav links */}
              <nav className="relative flex-1 px-4 pt-5 space-y-1">
                <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Navigation
                </p>
                {NAV_LINKS.map(({ to, label, icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/community"}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all border",
                        isActive
                          ? "bg-primary/8 dark:bg-primary/12 text-primary border-primary/15"
                          : "text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/8 border-transparent",
                      ].join(" ")
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    <span className="tracking-wide uppercase text-xs font-semibold">{label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* Bottom: user section */}
              <div className="relative px-4 pb-6 pt-4 border-t border-primary/10 space-y-3">
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Avatar size="sm">
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                        <AvatarFallback className="bg-primary/10">
                          <span className="material-symbols-outlined text-primary text-sm">
                            person
                          </span>
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-display font-semibold text-slate-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-primary hover:bg-primary/8 dark:hover:bg-primary/12 border border-transparent hover:border-primary/15 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span className="tracking-wide uppercase text-xs font-semibold">Logout</span>
                    </button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      navigate("/login")
                      setDrawerOpen(false)
                    }}
                    variant="outline"
                    className="w-full h-10 text-sm bg-white dark:bg-paper-dark border border-primary/10 text-primary hover:border-primary/30 hover:bg-primary hover:text-white dark:hover:text-white transition-all"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
