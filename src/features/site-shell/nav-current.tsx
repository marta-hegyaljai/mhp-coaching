"use client";

import {useLayoutEffect, useRef, type ReactNode} from "react";

import {usePathname} from "@/i18n/navigation";

export function NavCurrent({
  match,
  children,
}: {
  match: string | string[];
  children: ReactNode;
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
        active
          ? "[&_a]:shadow-[inset_0_-2px_0_0_currentColor]"
          : "[&_a]:shadow-[inset_0_-2px_0_0_transparent]"
      }
    >
      {children}
    </span>
  );
}
