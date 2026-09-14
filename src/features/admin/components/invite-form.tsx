"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {inviteUserAction} from "@/features/admin/actions";
import {AuthAlert, AuthField, AuthNotice} from "@/features/auth/components/auth-field";
import {Button} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

export function InviteUserForm({
  locale,
  onDismiss,
}: {
  locale: string;
  /** Called from the success state when the dialog should close. */
  onDismiss?: () => void;
}) {
  const t = useTranslations("Admin");
  const rooms = useTranslations("Rooms");
  const [state, formAction, pending] = useActionState(
    inviteUserAction.bind(null, locale),
    null,
  );

  if (state?.ok) {
    return (
      <div className="space-y-5">
        <AuthNotice>{t("invited")}</AuthNotice>
        {onDismiss ? (
          <Button type="button" onClick={onDismiss}>
            {rooms("closeDialog")}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate aria-busy={pending}>
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField name="firstName" label={t("firstName")} autoComplete="given-name" />
        <AuthField name="lastName" label={t("lastName")} autoComplete="family-name" />
      </div>
      <div>
        <AuthField name="email" type="email" label={t("email")} autoComplete="email" />
        <p className="mt-2 text-sm leading-6 text-ink-muted">{t("emailHint")}</p>
      </div>
      <CapabilityChecks />
      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <SpinnerIcon />
            {t("sending")}
          </>
        ) : (
          t("sendInvite")
        )}
      </Button>
    </form>
  );
}

export function CapabilityChecks({
  defaultAdmin = false,
  defaultRooms = false,
}: {
  defaultAdmin?: boolean;
  defaultRooms?: boolean;
}) {
  const t = useTranslations("Admin");

  return (
    <fieldset className="space-y-3 border border-ink px-4 py-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
        {t("accessLegend")}
      </legend>
      <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          name="isAdmin"
          defaultChecked={defaultAdmin}
          className="h-4 w-4 rounded-panel border-ink"
        />
        {t("grantAdmin")}
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          name="roomBookingEnabled"
          defaultChecked={defaultRooms}
          className="h-4 w-4 rounded-panel border-ink"
        />
        {t("grantRooms")}
      </label>
    </fieldset>
  );
}
