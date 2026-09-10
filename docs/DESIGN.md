# MHP Hypnose — UI Direction (Binding)

This document is the source of truth for public and authenticated platform UI.
Room-specific behavior is defined in [`ROOM-BOOKING.md`](./ROOM-BOOKING.md).
The intended
expression is **black and white with subtle gold, minimalist, mildly brutalist,
and classy**.
It is a serious European hypnosis school, not a wellness spa and not a SaaS
dashboard.

## Non-negotiable visual rules

- Use pure white (`#fff`) for the page and panel background. Do not use beige,
  cream, ivory, or warm off-white surfaces. The site footer is the one
  full-width black exception: a closing slab. Put the enrolment call to action
  inside that footer, separated by a hairline, never as a second black banner
  above a white footer.
- Use strong black rules, restrained neutral-grey hierarchy, editorial serif
  headings, functional sans-serif body copy, and the provided `gold` tokens.
  Course prices are commercial figures: set them in the sans-serif with
  tabular numbers, never the editorial serif.
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
- Multi-day sessions on the public calendar are one continuous named bar that
  spans every occupied day, including week wraps with continuation marks.
  Show the course name in small sans-serif type on the bar itself. Do not
  reduce a range to disconnected dotted cells.

## Navigation and locale stability

- Header navigation must expose Courses and Contact at every viewport. On
  phones they share one compact row with the brand and language control. The
  wordmark may shorten to MHP so those links stay visible and tappable. Do not
  hide them in a menu unless the information architecture grows beyond the MVP.
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

Public and authenticated shells may organize navigation differently, but they
must share tokens, controls and brand language. Authenticated navigation exposes
only server-derived capabilities: a course-only user does not see Rooms/Billing;
a therapist does. Admin navigation may group operational screens without turning
the whole product into a generic sidebar-heavy SaaS dashboard. On phones, use a
clear compact navigation pattern once the authenticated information architecture
no longer fits the public single-row rule; never hide the current section or
primary action behind an ambiguous icon.

## Authenticated platform and room calendar

- Keep the authenticated experience coherent with the public site: white
  surfaces, black rules, restrained gold, square geometry, no shadows and the
  same type hierarchy. Dense operational screens may use tighter functional
  sans-serif text while editorial headings retain the serif.
- Week is the primary room-calendar view and day view is required. On a phone,
  prioritize one navigable day or a horizontally controlled time grid rather
  than shrinking a seven-day desktop grid into illegibility. Preserve 44px
  targets and keep the selected date/room visible.
- Availability, booked, unavailable and “my booking” states must differ through
  label, border/pattern and contrast—not color alone. Other users' bookings say
  only “Booked”; never render names, notes or hidden private metadata.
- Use compact room filters/cards and time-slot controls. Avoid a long full-width
  list of every room/time combination. Show conflicts and changed availability
  next to the affected selection, then preserve the user's safe inputs.
- Before booking confirmation, keep the room, Zurich-local date/time, duration,
  base rate, discount when applicable and final CHF amount together. There is no
  payment step at booking time; say that monthly billing applies.
- Late cancellation is a destructive financial confirmation. State that the
  room will be released and show the exact retained charge. The safe “Keep
  booking” action must be visually clear; never rely on color alone.
- Private-note input includes the “no medical records or detailed clinical
  information” warning. Do not echo note content in calendar summaries,
  confirmations, admin previews or toasts visible to support staff.
- No-availability state offers an explicit request action and explains that a
  request does not reserve the slot. Its admin-visible message field carries a
  separate patient-information warning.
- Billing screens show minutes/hours, line items, adjustments, total and payment
  state with tabular numerals. Finalized historical statements must look fixed;
  admin corrections are separate labeled adjustments.
- Status styles remain monochrome and textual. Gold does not become a semantic
  success/warning/error color.

## Cards and actions

- Course and date cards use a 1px black border, white background, 2px radius,
  equal-height grid behavior, and no shadow. A course card is one full-surface
  link; never nest a second link inside it.
- Cards must show the decision essentials without another click: title,
  duration/price, Fribourg as the course location, the nearest date when
  available, and one clear action. An undated course is not sold until a
  session is published. Label its schedule as awaiting confirmation and route
  the primary action to a waiting-list form stored in PostgreSQL.
- When a course has several bookable dates, the card lists up to three of them
  in one grid: days, month and year each occupy a column so months start
  together and years start together. The nearest date stays on the meta line
  beside Fribourg. Any remaining dates become a small bordered `+n` counter
  next to the last listed year, with the spelled-out count in its accessible
  name.
- Primary actions are black rectangles with white text and reveal gold with
  black text on hover. Inverted primary actions start white and also reveal gold
  on hover. Secondary actions remain monochrome and gain a neutral-grey surface.
  Never make a control blend into its surrounding surface. Tap targets are at
  least 44px.
- One primary action per decision area. Supporting actions are secondary or
  underlined text links. On a dated course page the purchase button stays
  primary; a quieter waitlist link under it captures visitors whose published
  dates do not fit.
- Booking forms use the same bordered, rectangular language and keep the live
  summary visible on desktop. Validation must remain localized and accessible.

## Course imagery and source content

- The course catalogue opens with a compact editorial portrait of the
  instructor beside the page title, not a full-bleed banner that hides the
  course grid. Keep the photograph high-contrast and structurally separate
  from the cards; do not replace it with generic stock imagery.
- Every course card and detail page uses its corresponding historical course
  image from `public/images/courses`. Images support recognition and hierarchy;
  they must not become decorative full-page backgrounds or introduce new accent
  colors into controls. The homepage statue is cropped from the top and carries
  a black overlay panel for the intro and booking actions, in the same register
  as the hypnomeditation overlay on the legacy site.
- Course-card artwork is a compact square thumbnail beside the title. Never
  split a card into two tall columns or give artwork half the card width: that
  creates narrow text measures, oversized headings, and excessive empty height.
  Catalogue descriptions are limited to three lines; the full copy belongs on
  the course detail page.
- The small `/` and `//` registration marks embedded at the top right of the
  historical square artwork are visually removed wherever it is displayed,
  without cropping the course name from the image.
- Detailed course claims, objectives, prerequisites, recognitions, prices, and
  descriptions must trace to the historical MHP catalogue. Do not invent copy
  to fill a layout. A missing translation may fall back visibly to the exact
  French source until a faithful translation is added.
- Legacy references to Lausanne or Geneva must not be restored. The current and
  only course location is Fribourg. Course dates remain unpublished until the
  business supplies them.

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
- Prices: `<Price>` in `src/shared/ui/price.tsx`.
- Shell: `src/features/site-shell`; do not fork per-page headers or switchers.
  `SiteFooter` is black; inverted (white) buttons sit on it.
- Course decisions: `CourseCard`, `CourseDates`, and `CourseBookingBar`.
- Email: `composeTransactionalEmail()` in `src/features/email/layout.ts`.
  Binding layout and copy: `docs/EMAIL.md`. Do not hand-roll notification
  HTML or reuse page components in mail.

## Agent completion gate

For visual work: read this file, reuse the primitives, implement, run
`pnpm verify`, inspect the affected flow in a browser at desktop and ~390px,
check FR/DE/EN, inspect browser/server errors, fix defects, then report.

For room UI, also inspect privacy-safe calendar payloads, day/week navigation,
late-cancellation copy, Zurich-local time rendering, capability-dependent
navigation and owner/admin views. A desktop calendar alone is not acceptance.
