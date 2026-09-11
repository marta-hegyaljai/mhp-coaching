import type {ButtonHTMLAttributes, ReactNode} from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "invert";
export type ButtonSize = "md" | "lg";

type StyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

// Rectangular controls carry the mildly brutal visual language. Motion is
// reserved for actionable controls and confirms intent without decoration.
// Each variant owns its border colour; the base must not set one, because
// utilities of equal specificity resolve by stylesheet order, not class order.
const base =
  "group/button inline-flex cursor-pointer items-center justify-center gap-2 rounded-panel border font-semibold tracking-[0.02em] transition-[background-color,color,border-color,transform] duration-150 ease-standard active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55";

const sizes: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-13 px-7 text-base",
};

// Each variant carries its own focus colour so the ring always contrasts with
// the surface the button sits on.
const variants: Record<ButtonVariant, string> = {
  primary:
    "border-ink bg-ink text-parchment hover:border-gold hover:bg-gold hover:text-ink focus-visible:outline-ink",
  secondary:
    "border-ink bg-shell text-ink hover:bg-hover focus-visible:outline-ink",
  quiet:
    "border-transparent text-ink underline-offset-4 hover:underline focus-visible:outline-ink",
  invert:
    "border-parchment bg-parchment text-ink hover:border-gold hover:bg-gold focus-visible:outline-parchment",
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
