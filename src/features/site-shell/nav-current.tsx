"use client";

import {useLayoutEffect, useRef, type ReactNode} from "react";

import {usePathname} from "@/i18n/navigation";

import {isCurrentPath} from "./nav-path";

/** The open section is a filled square chip, never an underline. */
export const NAV_CURRENT_CHIP =
  "[&_a]:bg-ink [&_a]:text-parchment [&_a]:hover:bg-ink [&_a]:hover:text-parchment";

export function NavCurrent({
  match,
  exact = false,
  activeClassName = NAV_CURRENT_CHIP,
  children,
}: {
  match: string;
  exact?: boolean;
  /** Empty keeps `aria-current` without a visual state, e.g. the wordmark. */
  activeClassName?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLSpanElement>(null);
  const active = isCurrentPath(pathname, match, exact);

  // The link itself is server-rendered, so the flag is applied to the DOM node.
  useLayoutEffect(() => {
    const link = rootRef.current?.querySelector("a");
    if (!link) {
      return;
    }
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }, [active, pathname]);

  return (
    <span ref={rootRef} className={active ? activeClassName : ""}>
      {children}
    </span>
  );
}
