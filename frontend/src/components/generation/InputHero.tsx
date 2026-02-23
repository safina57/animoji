interface InputHeroProps {
  title: string;
  titleJa: string;
}

export default function InputHero({ title, titleJa }: InputHeroProps) {
  return (
    <div className="text-center space-y-4 animate-fade-in">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 dark:text-white">
        {title}
      </h1>
      <p className="text-sm md:text-base text-primary/60 dark:text-primary/40 font-japanese uppercase tracking-[0.4em] font-medium">
        {titleJa}
      </p>
    </div>
  );
}
