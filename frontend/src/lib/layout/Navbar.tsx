import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@hooks/redux";
import { logout } from "@store/slices/authSlice";
import { authService } from "@services/authService";
import { Button } from "@lib/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@lib/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@lib/ui/avatar";

export default function Navbar() {
  const [dark, setDark] = useState(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      dispatch(logout());
      navigate("/");
    }
  };

  return (
    <nav className="border-b border-primary/10 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: logo + links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-primary text-3xl font-display font-bold tracking-tight">
              Animoji
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide uppercase">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "text-primary"
                  : "hover:text-primary transition-colors text-slate-600 dark:text-slate-400"
              }
            >
              Community
            </NavLink>
            <NavLink
              to="/create"
              className={({ isActive }) =>
                isActive
                  ? "text-primary"
                  : "hover:text-primary transition-colors text-slate-600 dark:text-slate-400"
              }
            >
              Create
            </NavLink>
            <span className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400 opacity-50 cursor-not-allowed">
              Gallery
            </span>
          </div>
        </div>

        {/* Right: dark toggle + user menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDark((d) => !d)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? (
              <span className="material-symbols-outlined text-yellow-400">
                light_mode
              </span>
            ) : (
              <span className="material-symbols-outlined">dark_mode</span>
            )}
          </button>

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
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-primary data-[highlighted]:!text-primary data-[highlighted]:!bg-primary/10 dark:data-[highlighted]:!bg-primary/20"
                >
                  <span className="material-symbols-outlined text-base mr-2">logout</span>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => {
                if (location.pathname !== "/auth") {
                  navigate("/auth");
                }
              }}
              variant="outline"
              className="h-8 px-4 text-sm border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
