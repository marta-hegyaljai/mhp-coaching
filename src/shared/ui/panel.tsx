import type {ReactNode} from "react";

export type PanelPadding = "sm" | "md";
export type PanelTone = "white" | "shell" | "ink";

const paddings: Record<PanelPadding, string> = {
  sm: "p-4",
  md: "p-5 sm:p-6",
};

// The neutral grey is the only alternative surface; it marks a consequence
// without introducing a semantic colour. `ink` inverts the card for the one
// action that closes a grid of claims.
const tones: Record<PanelTone, string> = {
  white: "bg-white",
  shell: "bg-shell",
  ink: "bg-ink text-parchment",
};

/**
 * The single bordered surface used across authenticated screens. Depth comes
 * from the 1px rule and spacing, never from a shadow.
 */
export function Panel({
  children,
  padding = "md",
  tone = "white",
  as = "div",
  className = "",
  ariaLabelledBy,
}: {
  children: ReactNode;
  padding?: PanelPadding;
  tone?: PanelTone;
  as?: "div" | "section" | "article" | "li";
  className?: string;
  ariaLabelledBy?: string;
}) {
  const Tag = as;

  return (
    <Tag
      aria-labelledby={ariaLabelledBy}
      className={`rounded-panel border border-ink ${tones[tone]} ${paddings[padding]} ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Separates two groups inside one panel without starting a new surface. */
export function PanelDivider({className = ""}: {className?: string}) {
  return <hr className={`border-0 border-t border-line ${className}`} />;
}
