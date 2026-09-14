/** One geometry for every header navigation control, link or group trigger. */
const navChipBase =
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-panel px-3 text-xs font-semibold tracking-[0.1em] whitespace-nowrap uppercase transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export const navChipClass = `${navChipBase} text-ink hover:bg-hover`;

/**
 * The open section is a filled square chip, never an underline. States are
 * whole class strings so no hover utility of the idle state can win over it.
 */
export const navChipCurrentClass = `${navChipBase} bg-ink text-parchment`;
