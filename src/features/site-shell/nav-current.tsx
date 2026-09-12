"use client";

import {useLayoutEffect, useRef, type ReactNode} from "react";

import {usePathname} from "@/i18n/navigation";

export function NavCurrent({
  match,
  children,
  indicate = true,
}: {
  match: string | string[];
  children: ReactNode;
  /** When false, still sets aria-current but skips the selected chip style (e.g. brand). */
  indicate?: boolean;
}) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLSpanElement>(null);
  const matches = Array.isArray(match) ? match : [match];
  const active = matches.some((candidate) => {
    if (candidate === "/") {
      return pathname === "/";
    }
    return pathname === candidate || pathname.startsWith(`${candidate}/`);
  });

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
    <span
      ref={rootRef}
      className={
        active && indicate
          ? "[&_a]:bg-ink [&_a]:text-parchment [&_a]:hover:bg-ink [&_a]:hover:text-parchment"
          : ""
      }
    >
      {children}
    </span>
  );
}
