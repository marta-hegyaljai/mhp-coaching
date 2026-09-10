"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {updateUserAccessAction} from "@/features/admin/actions";
import {CapabilityChecks} from "@/features/admin/components/invite-form";
import type {AdminUserView} from "@/features/admin/user-view";
import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {Button} from "@/shared/ui/button";
import {SpinnerIcon} from "@/shared/ui/icons";

export function UserAccessForm({
  locale,
  user,
}: {
  locale: string;
  user: AdminUserView;
}) {
  const t = useTranslations("Admin");
  const [state, formAction, pending] = useActionState(
    updateUserAccessAction.bind(null, locale, user.id),
    null,
  );

  return (
    <div className="space-y-10">
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.ok ? <AuthNotice>{t("updated")}</AuthNotice> : null}

      <section className="max-w-xl space-y-4">
        <h2 className="font-serif text-subheading">{t("accessTitle")}</h2>
        <p className="text-sm leading-7 text-ink-muted">{t("accessHelp")}</p>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="intent" value="save" />
          <CapabilityChecks
            defaultAdmin={user.isAdmin}
            defaultRooms={user.roomBookingEnabled}
          />
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <SpinnerIcon />
                {t("saving")}
              </>
            ) : (
              t("saveAccess")
            )}
          </Button>
        </form>
      </section>

      <section className="max-w-xl space-y-4">
        <h2 className="font-serif text-subheading">{t("accountTitle")}</h2>
        <p className="text-sm leading-7 text-ink-muted">
          {user.disabled ? t("enableHelp") : t("disableHelp")}
        </p>
        <form action={formAction}>
          <input
            type="hidden"
            name="intent"
            value={user.disabled ? "enable" : "disable"}
          />
          <Button type="submit" variant="secondary" disabled={pending}>
            {user.disabled ? t("enable") : t("disable")}
          </Button>
        </form>
      </section>

      {user.pendingInvite && !user.disabled ? (
        <section className="max-w-xl space-y-4">
          <h2 className="font-serif text-subheading">{t("invite")}</h2>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="intent" value="resend" />
            <input type="hidden" name="email" value={user.email} />
            <input type="hidden" name="firstName" value={user.firstName} />
            <input type="hidden" name="lastName" value={user.lastName} />
            {user.isAdmin ? <input type="hidden" name="isAdmin" value="on" /> : null}
            {user.roomBookingEnabled ? (
              <input type="hidden" name="roomBookingEnabled" value="on" />
            ) : null}
            <Button type="submit" variant="secondary" disabled={pending}>
              {t("resendInvite")}
            </Button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
