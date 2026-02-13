import { Link } from "react-router-dom";
import { Button } from "@lib/ui/button";
import { Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-background-light to-sakura-pink/10 dark:from-background-dark dark:to-indigo-deep/20">
      <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in">
        {/* Torii Gate 404 */}
        <div className="relative">
          {/* Large 404 */}
          <div className="text-[180px] md:text-[240px] font-display font-bold leading-none text-primary/10 dark:text-primary/5 select-none">
            404
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white">
            Lost in Tokyo?
          </h1>
          <p className="text-lg text-primary/60 dark:text-primary/40 font-japanese uppercase tracking-[0.3em]">
            迷子になりました
          </p>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Looks like you've wandered into an uncharted district. This page doesn't exist in our anime universe.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/">
            <Button size="lg" className="gap-2">
              <Home className="h-5 w-5" />
              Return Home
            </Button>
          </Link>
          <Link to="/create">
            <Button variant="outline" size="lg">
              Start Creating
            </Button>
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="flex items-center justify-center gap-8 pt-8 opacity-30">
          <div className="w-16 h-16 rounded-full bg-sakura-pink/50 animate-float" />
          <div className="w-12 h-12 rounded-full bg-fuji-blue/50 animate-float" style={{ animationDelay: "1s" }} />
          <div className="w-20 h-20 rounded-full bg-primary/30 animate-float" style={{ animationDelay: "2s" }} />
        </div>
      </div>
    </div>
  );
}

