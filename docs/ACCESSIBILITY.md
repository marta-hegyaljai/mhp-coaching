# Accessibility pass — CP-11

Checked against [`DESIGN.md`](./DESIGN.md): 44px targets, visible focus,
keyboard access, contrast from black/white, no information by colour alone,
`prefers-reduced-motion` already limits animation to clickable encouragement.

## Pass notes (2026-09-11)

| Surface | Result |
| --- | --- |
| Skip link | `Skip to content` / FR / DE in `SiteShell`, first in tab order |
| Public header | Courses + Contact remain on the same row as MHP at ~390px |
| Language switcher | Custom listbox, fixed width, does not shift neighbours |
| Status | `StatusLabel` uppercase text, not pills or colour-only |
| Prices / minutes | Sans-serif tabular nums |
| Month picker | `aria-current` and `aria-label` include Open/Closed + month |
| Statement cards | `aria-label` includes status + month |
| Forms | Shared `Field` labels; errors `role="alert"` |
| Calendar | Slot states differ by label and pattern; others' bookings say “Booked” |
| Email | Table layout, gold eyebrow only, no UUID to buyers |

## Keyboard

Primary flows (sign-in, book a course, room slot confirm, billing setup fake
card, admin charge) are button/link/form controls with visible
`focus-visible` outlines.

## Residual

- No axe/pa11y job in CI. Re-run a keyboard pass on Vercel production after
  the app domain is attached.
- Native `<input type="date">` still follows the browser locale, not the page
  locale (known DESIGN.md follow-up).
