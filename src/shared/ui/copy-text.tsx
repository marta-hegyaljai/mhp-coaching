"use client";

import {useState} from "react";

export async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.append(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

/**
 * Shows a truncated value and copies the full string on click, so a dense
 * operational table can keep a long address without making it hard to grab.
 */
export function CopyText({
  value,
  label,
  copiedLabel,
  truncate = true,
  className = "",
}: {
  value: string;
  label: string;
  copiedLabel: string;
  /** Truncate long values; keep false for short facts like a phone number. */
  truncate?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await copyTextToClipboard(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      title={value}
      aria-label={label}
      onClick={() => void copy()}
      className={`inline-flex min-h-11 min-w-0 items-center text-left font-sans text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${truncate ? "w-full max-w-full" : ""} ${className}`}
    >
      <span className={truncate ? "block min-w-0 w-full truncate" : "whitespace-nowrap"}>
        {copied ? copiedLabel : value}
      </span>
    </button>
  );
}
