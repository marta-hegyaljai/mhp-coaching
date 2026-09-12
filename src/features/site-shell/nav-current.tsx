"use client";

import type {ReactNode} from "react";

import {usePathname} from "@/i18n/navigation";

export function NavCurrent({
  match,
  children,
}: {
  match: string | string[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const matches = Array.isArray(match) ? match : [match];
  const active = matches.some((candidate) => {
    if (candidate === "/") {
      return pathname === "/";
    }
    return pathname === candidate || pathname.startsWith(`${candidate}/`);
  });

  return (
    <span
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
