import type {ButtonHTMLAttributes, ReactNode} from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "invert";
export type ButtonSize = "md" | "lg";

type StyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

// Tap targets stay at or above 44px and every button confirms the press with a
// short scale, so links and submits feel the same under a thumb.
const base =
  "group/button inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition duration-200 ease-standard active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-55";

const sizes: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-13 px-7 text-base",
};

// Each variant carries its own focus colour so the ring always contrasts with
// the surface the button sits on.
const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-ivory shadow-press hover:bg-bronze hover:shadow-lift focus-visible:outline-bronze",
  secondary:
    "border border-ink/15 bg-parchment text-ink shadow-press hover:border-bronze hover:text-bronze focus-visible:outline-bronze",
  quiet: "text-ink-muted hover:text-bronze focus-visible:outline-bronze",
  invert:
    "bg-ivory text-ink shadow-press hover:bg-bronze hover:text-ivory focus-visible:outline-ivory",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  block = false,
}: StyleOptions = {}): string {
  return [
    base,
    sizes[size],
    variants[variant],
    block ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  StyleOptions & {
    children: ReactNode;
  };

export function Button({
  variant,
  size,
  block,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`${buttonStyles({variant, size, block})} ${className}`}
    >
      {children}
    </button>
  );
}
