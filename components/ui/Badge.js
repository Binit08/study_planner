export default function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}) {
  const variants = {
    default: "bg-surface border-border-subtle text-text-secondary",
    accent: "bg-accent-blue/10 border-accent-blue/30 text-accent-blue",
    amber: "bg-accent-amber/10 border-accent-amber/30 text-accent-amber",
    mastered: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    learning: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    unseen: "bg-zinc-800/80 border-border-subtle text-text-tertiary",
    danger: "bg-rose-500/10 border-rose-500/30 text-rose-400",
  };

  const sizes = {
    xs: "px-2 py-0.5 text-[10px]",
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${
        variants[variant] || variants.default
      } ${sizes[size] || sizes.sm} ${className}`}
    >
      {children}
    </span>
  );
}
