import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@lib/ui/navigation-menu"
import { cn } from "@lib/utils"
import { GALLERY_SECTION } from "@store/slices/gallerySlice"
import type { GallerySection } from "@store/slices/gallerySlice"

const NAV_ITEMS: { value: GallerySection; icon: string; label: string; labelJa: string }[] = [
  { value: GALLERY_SECTION.PUBLIC, icon: "public", label: "Public", labelJa: "公開" },
  { value: GALLERY_SECTION.PRIVATE, icon: "lock", label: "Private", labelJa: "非公開" },
  { value: GALLERY_SECTION.EMOJIS, icon: "emoji_emotions", label: "Stickers", labelJa: "スタンプ" },
]

interface GallerySidebarProps {
  value: GallerySection
  onChange: (v: GallerySection) => void
}

export default function GallerySidebar({ value, onChange }: GallerySidebarProps) {
  return (
    <aside className="w-full md:w-52 shrink-0">
      <p className="hidden md:block mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        My Gallery
      </p>

      <NavigationMenu orientation="vertical" className="max-w-none w-full">
        <NavigationMenuList className="flex-row md:flex-col items-stretch gap-1.5 space-x-0 w-full">
          {NAV_ITEMS.map(({ value: v, icon, label, labelJa }) => (
            <NavigationMenuItem key={v} className="flex-1 md:flex-none md:w-full">
              <NavigationMenuLink
                onClick={() => onChange(v)}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "w-full justify-center md:justify-start gap-2 px-3 h-10 rounded-lg cursor-pointer transition-all",
                  value === v
                    ? "bg-primary/8 dark:bg-primary/12 text-primary border border-primary/15"
                    : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-primary border border-transparent"
                )}
              >
                <span className="material-symbols-outlined text-[18px] shrink-0">{icon}</span>
                <span className="text-xs font-semibold tracking-wide">{label}</span>
                <span className="text-[10px] font-japanese text-muted-foreground/60 hidden md:block">
                  {labelJa}
                </span>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </aside>
  )
}
