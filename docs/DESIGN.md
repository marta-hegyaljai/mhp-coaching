# MHP Hypnose — UI Direction (Binding)

This document is the source of truth for every public UI change. The intended
expression is **black and white with subtle gold, minimalist, mildly brutalist,
and classy**.
It is a serious European hypnosis school, not a wellness spa and not a SaaS
dashboard.

## Non-negotiable visual rules

- Use pure white (`#fff`) for the page and panel background. Do not use beige,
  cream, ivory, or warm off-white surfaces.
- Use strong black rules, restrained neutral-grey hierarchy, editorial serif
  headings, functional sans-serif body copy, and the provided `gold` tokens.
- Gold is a scarce behavioral and editorial accent: it appears when
  high-priority CTA buttons are hovered and on selected small uppercase eyebrow
  labels, including course duration (days/hours). Never use gold as a resting
  button color, selected control state, large background, body-copy color, card
  fill, or dense repeated decoration.
- No bronze, brown, gradients, or additional accent colors. The legacy token
  name `bronze` is a black compatibility alias and must not guide new work.
- Geometry is rectangular with `rounded-panel` (2px). The compact language
  trigger is the sole capsule exception. Never use pills for buttons, cards,
  tags, or status displays.
- Do not use shadows on public UI. Depth comes from contrast, borders, spacing,
  and typographic scale.
- Brutalist details are controlled: crisp borders, uppercase micro-labels,
  visible structure, and direct copy. Avoid noisy grids, novelty type,
  oversized outlines, or deliberately awkward layouts.
- Prefer a compact grid of cards when presenting two or more possibilities.
  Do not turn choices into a long sequence of full-width rows or force users
  through oversized vertical sections.
- Keep page sections compact enough to reveal the next decision. Whitespace is
  deliberate, never used to make a sparse page feel artificially large.

## Navigation and locale stability

- Header navigation must expose Courses and Contact at every viewport. On
  phones they appear in one compact row below the brand; do not hide them in a
  menu unless the information architecture grows beyond the MVP.
- The language switcher is a custom accessible dropdown. Its closed trigger
  is a compact neutral capsule inspired by the reference site, shows only the
  stable locale code, has a fixed width, and opens a bordered menu with native
  language names. The menu and selected item remain monochrome. It preserves the
  equivalent localized route where available.
- Switching FR/DE/EN must not move adjacent controls. Any localized control in
  shared chrome needs fixed or minimum dimensions based on the longest label.
- Keep no more than one high-emphasis booking action in the header/viewport.
  Labels may wrap inside content cards but may not resize the card grid or
  cause horizontal movement.

## Cards and actions

- Course and date cards use a 1px black border, white background, 2px radius,
  equal-height grid behavior, and no shadow. A course card is one full-surface
  link; never nest a second link inside it.
- Cards must show the decision essentials without another click: title,
  duration/price, Fribourg as the course location, the nearest date when
  available, and one clear action. Until dates are confirmed, show the explicit
  no-dates state and direct visitors to contact rather than presenting a booking
  action.
- Primary actions are black rectangles with white text and reveal gold with
  black text on hover. Inverted primary actions start white and also reveal gold
  on hover. Secondary actions remain monochrome and gain a neutral-grey surface.
  Never make a control blend into its surrounding surface. Tap targets are at
  least 44px.
- One primary action per decision area. Supporting actions are secondary or
  underlined text links.
- Booking forms use the same bordered, rectangular language and keep the live
  summary visible on desktop. Validation must remain localized and accessible.

## Motion allowlist

Motion exists only to reinforce something clickable:

- buttons/linked cards: 150ms tonal change or at most a 2px lift;
- arrow inside a call to action: at most 4px horizontal movement;
- pressed controls: at most 1px vertical movement;
- loading spinner: rotation while work is pending.

No entrance animation, scroll animation, parallax, pulsing decoration, ambient
motion, or animated background. Always honor `prefers-reduced-motion`.

## Responsive and accessibility

- Design mobile-first and inspect at approximately 390px, tablet, and desktop.
- No horizontal overflow. Maintain 44px controls and one-handed booking/date
  interaction. Avoid sticky elements covering content.
- Use semantic structure, sufficient contrast, visible focus, explicit labels,
  keyboard access, and no meaning conveyed by color alone.
- Check FR, DE, and EN for wrapping, header stability, card height, and control
  width before completion.

## Implemented primitives

- Tokens: `src/app/globals.css` (`ivory` and `parchment` are pure-white
  compatibility names; `shell`, `hover`, `ink`, muted greys, `gold`, lines,
  type scale, 2px `rounded-panel`, `ease-standard`).
- Actions: `buttonStyles()` / `<Button>` in `src/shared/ui/button.tsx`.
- Rhythm: `Section`, `Container`, `Eyebrow` in `src/shared/ui/layout.tsx`.
- Shell: `src/features/site-shell`; do not fork per-page headers or switchers.
- Course decisions: `CourseCard`, `CourseDates`, and `CourseBookingBar`.

## Agent completion gate

For visual work: read this file, reuse the primitives, implement, run
`pnpm verify`, inspect the affected flow in a browser at desktop and ~390px,
check FR/DE/EN, inspect browser/server errors, fix defects, then report.
