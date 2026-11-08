export default function Card({
  children,
  className = "",
  hover = false,
  glow = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border border-border-subtle bg-surface-translucent backdrop-blur-md p-5 transition-all duration-200 ${
        hover
          ? "hover:border-border-translucent hover:bg-surface-hover hover:shadow-glass cursor-pointer"
          : ""
      } ${
        glow
          ? "before:absolute before:inset-0 before:-z-10 before:rounded-xl before:bg-gradient-to-r before:from-accent-amber/5 before:to-accent-blue/5 before:blur-xl"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
