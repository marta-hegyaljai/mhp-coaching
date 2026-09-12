/**
 * Whether a navigation entry owns the current route. Nested routes keep their
 * parent section marked, except for entries flagged `exact` such as `/account`,
 * which would otherwise also claim `/account/courses`.
 */
export function isCurrentPath(
  pathname: string,
  match: string,
  exact = false,
): boolean {
  if (match === "/" || exact) {
    return pathname === match;
  }

  return pathname === match || pathname.startsWith(`${match}/`);
}
