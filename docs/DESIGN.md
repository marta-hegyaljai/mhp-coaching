# MHP Hypnose — Design Direction

## Reference
Primary visual reference: https://marta-hegyaljai.com/fr

Use it as brand/visual direction, not as a pixel-for-pixel clone. Do not copy assets unless they are explicitly provided/owned by MHP.

## Desired feeling
- premium
- calm
- artistic
- confident
- human
- European/editorial
- mature
- trustworthy

This is a hypnosis training school, not a SaaS product.

## Direction
Prefer:
- warm off-white / ivory / stone backgrounds
- charcoal/near-black text
- restrained earthy/bronze/brown accents
- large editorial headings
- generous whitespace
- strong typographic hierarchy
- high-quality art/photography when provided
- simple layouts, occasional deliberate asymmetry
- subtle motion only if it adds polish
- excellent mobile typography/spacing

Avoid:
- generic blue SaaS palettes
- bright gradients
- excessive rounded cards
- dashboard aesthetics on public pages
- glassmorphism
- heavy shadows
- generic stock business imagery
- clutter/tiny text
- performance-harming animation

## Components
Public UI should feel editorial:
- header/navigation
- language switcher
- hero
- course introduction/list
- course detail sections
- date selection
- obvious booking CTA
- footer

Use cards sparingly; prefer typography, spacing and layout before wrapping everything in boxes.

## Responsive
Design mobile-first.
Always inspect around 390px phone width, tablet and desktop.
No horizontal overflow; comfortable tap targets; booking/date controls must work one-handed.

## Accessibility
Semantic structure, sufficient contrast, visible focus states, labels/errors, keyboard access, no color-only meaning, reduced-motion respect.

## Implemented system
Tokens live in `src/app/globals.css` under `@theme`. Use them instead of raw values:
- surfaces: `ivory` (page), `shell` (alternating section), `parchment` (panels, inputs)
- text: `ink`, `ink-muted`, `ink-subtle` (all above 4.5:1 on ivory), `bronze` for accents
- type: `text-display`, `text-title`, `text-heading`, `text-subheading`, `text-lead` (fluid, clamped)
- surface detail: `rounded-panel`, `shadow-press`, `shadow-lift`, `ease-standard`

Primitives live in `src/shared/ui`:
- `buttonStyles()` / `<Button>` — capsule calls to action, variants `primary`, `secondary`, `quiet`, `invert` (dark surfaces), sizes `md` (44px) and `lg` (52px), with press feedback and per-variant focus ring. Never combine a responsive `hidden` with these styles on the same element; wrap the element instead.
- `Section`, `Container`, `Eyebrow` — page rhythm and section tone
- `icons.tsx` — inline currentColor icons

Call to action conventions:
- one primary action per view; supporting actions use `secondary` or `quiet`
- course pages carry a phone-only action bar (`CourseBookingBar`) and `SiteShell` reserves the space it covers
- each published date is its own link into the booking form, which preselects it from `?date=`
- the booking form shows a live summary, keeps typed input when validation fails, and suppresses browser validation bubbles in favour of localized messages
- `SiteShell` closes pages with a dark call to action band; pass `footerCta={null}` where a page is already the offer

## Agent rule
For visual work: read this file → implement → inspect browser → inspect phone viewport → fix defects → only then report completion.
