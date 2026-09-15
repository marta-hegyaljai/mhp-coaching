/**
 * The grid rhythm lives here alone: the time label sets the row height and
 * every slot bar is stretched onto those rows, so a click can never land on a
 * different interval than the label it sits next to.
 */
export const slotRowClass = "box-border h-11";

/**
 * Equal tracks inside a bar that spans several intervals. `1fr` divides the
 * height the table actually rendered, so rounding cannot accumulate into a
 * whole interval of drift the way a fixed rem height did.
 */
export function slotTrackRows(span: number): string {
  return `repeat(${Math.max(Math.trunc(span) || 1, 1)}, 1fr)`;
}

/** Full hours carry the dotted rule that anchors the eye to the labels. */
export function isHourStart(time: string | undefined): boolean {
  return typeof time === "string" && time.endsWith(":00");
}
