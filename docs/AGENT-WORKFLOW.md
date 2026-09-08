# MHP Hypnose — Agentic Development Workflow

## Goal
Support disciplined development with Codex, Cursor Cloud Agents, and local
contributors:

Prompt → agent branch → implementation → verification → browser inspection → PR → Vercel preview → phone review → follow-up or merge.

## Loop
For every meaningful task:

1. **Understand** — read AGENTS.md + relevant docs and inspect current code.
   Visual work must follow `docs/DESIGN.md` and, for Cursor, the mirrored
   `.cursor/rules/mhp-ui.mdc` guardrail.
2. **Plan** — choose the smallest reviewable vertical slice; preserve MVP scope.
3. **Implement** — keep provider code localized; prefer Server Components; keep UI mobile/accessibility friendly.
4. **Verify mechanically** — run `pnpm verify` + relevant tests.
5. **Verify behavior** — run the app and exercise the changed flow. For UI inspect desktop + ~390px mobile + FR/DE/EN where relevant.
6. **Iterate** — fix what tests/browser inspection reveal.
7. **Report** — summarize changes, tests, assumptions/limitations, preview/PR details.

Do not call work complete merely because code compiles.

## Good phone-sized tasks
- Implement global shell/homepage in all locales.
- Add hardcoded course catalogue + localized course pages.
- Persist booking form submissions.
- Add FakePaymentProvider + E2E flow.
- Add Stripe Checkout behind PaymentProvider.
- Add protected booking list.

Avoid vague tasks such as "build the whole app" or "improve the design".

## External-system safety
Cloud agents/previews:
- no production Stripe secrets
- no production DB mutation without explicit authorization
- fake payments or Stripe test mode
- no real customer email from local/preview
- no secrets in git

Prefer small PRs, screenshots for visual work and migrations committed with the code that needs them.
