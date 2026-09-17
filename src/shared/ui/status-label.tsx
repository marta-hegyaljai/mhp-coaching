import type {ReactNode} from "react";

export type StatusTone = "strong" | "muted" | "ok" | "stop" | "gold";

/**
 * Type colour for a status. Semantic tones are for operational screens;
 * `strong` / `muted` stay monochrome for public catalogue copy.
 */
export const statusToneClass: Record<StatusTone, string> = {
  strong: "text-ink",
  muted: "text-ink-subtle",
  ok: "text-status-ok",
  stop: "text-status-stop",
  gold: "text-gold-deep",
};

/**
 * 3px left rail. Semantic tones colour it; the rest stay transparent so a
 * mixed list does not shift when only some rows need a highlight.
 */
export function statusRailClass(tone: StatusTone | null | undefined): string {
  const color =
    tone === "ok"
      ? "border-l-status-ok"
      : tone === "stop"
        ? "border-l-status-stop"
        : tone === "gold"
          ? "border-l-gold-deep"
          : "border-l-transparent";

  return `border-l-[3px] ${color}`;
}

export function StatusLabel({
  children,
  tone = "strong",
  className = "",
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <p
      className={`text-[0.7rem] font-bold uppercase tracking-[0.2em] ${statusToneClass[tone]} ${className}`}
    >
      {children}
    </p>
  );
}
