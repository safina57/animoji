import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const [dark, setDark] = useState(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

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

        {/* Right: dark toggle + avatar */}
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

          <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg">
              person
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
