"use client";

import {AuthAlert} from "@/features/auth/components/auth-field";
import type {PathnameHref} from "@/i18n/href";
import {Link} from "@/i18n/navigation";
import {Button, buttonStyles} from "@/shared/ui/button";
import {Panel, PanelDivider} from "@/shared/ui/panel";
import {Price} from "@/shared/ui/price";
import {SectionLabel} from "@/shared/ui/section-label";
import {SubmitButton} from "@/shared/ui/submit-button";

type KeepAction =
  | {href: PathnameHref; label: string}
  | {onClick: () => void; label: string};

/**
 * A financial confirmation, so the figure that will be retained is shown as a
 * price rather than buried in a sentence, and the safe way out is the
 * prominent action. Nothing here depends on colour.
 */
export function DestructiveConfirm({
  label,
  message,
  note,
  retained,
  keep,
  confirm,
  action,
  pending,
  error,
  embedded = false,
}: {
  label: string;
  message: string;
  /** What happens to the slot once confirmed. */
  note?: string;
  retained?: {label: string; amount: string};
  keep: KeepAction;
  confirm: {label: string; pendingLabel: string};
  action: (payload: FormData) => void;
  pending: boolean;
  error?: string;
  /** Renders without the outer panel for use inside a dialog. */
  embedded?: boolean;
}) {
  const body = (
    <>
      {!embedded ? <SectionLabel>{label}</SectionLabel> : null}
      <p className={`text-sm leading-7 text-ink ${embedded ? "" : "mt-3"}`}>{message}</p>
      {retained ? (
        <div className={embedded ? "mt-5" : "mt-5"}>
          <SectionLabel>{retained.label}</SectionLabel>
          <p className="mt-2">
            <Price size="md">{retained.amount}</Price>
          </p>
        </div>
      ) : null}
      {note ? <p className="mt-4 text-sm leading-6 text-ink-muted">{note}</p> : null}
      {!embedded ? <PanelDivider className="mt-6" /> : null}
      <form action={action} className={embedded ? "mt-6 space-y-5" : "mt-6 space-y-5"}>
        {error ? <AuthAlert>{error}</AuthAlert> : null}
        <div className="flex flex-wrap items-center gap-3">
          {"href" in keep ? (
            <Link href={keep.href} className={buttonStyles()}>
              {keep.label}
            </Link>
          ) : (
            <Button type="button" onClick={keep.onClick} className={buttonStyles()}>
              {keep.label}
            </Button>
          )}
          <SubmitButton
            variant="secondary"
            pending={pending}
            label={confirm.label}
            pendingLabel={confirm.pendingLabel}
          />
        </div>
      </form>
    </>
  );

  if (embedded) {
    return body;
  }

  return <Panel>{body}</Panel>;
}
