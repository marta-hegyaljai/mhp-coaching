"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {updateUserDiscountAction} from "@/features/admin/actions";
import type {AdminUserView} from "@/features/admin/user-view";
import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {MAX_ROOM_DISCOUNT_PERCENT} from "@/features/rooms/pricing";
import {Button} from "@/shared/ui/button";
import {InputField} from "@/shared/ui/field";
import {SpinnerIcon} from "@/shared/ui/icons";

export function UserDiscountForm({
  locale,
  user,
}: {
  locale: string;
  user: AdminUserView;
}) {
  const t = useTranslations("Admin");
  const [state, formAction, pending] = useActionState(
    updateUserDiscountAction.bind(null, locale, user.id),
    null,
  );

  return (
    <section className="max-w-xl space-y-4">
      <h2 className="font-serif text-subheading">{t("discountTitle")}</h2>
      <p className="text-sm leading-7 text-ink-muted">{t("discountHelp")}</p>
      {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
      {state?.ok ? <AuthNotice>{t("discountUpdated")}</AuthNotice> : null}
      <form action={formAction} className="space-y-5">
        <InputField
          id="discountPercent"
          name="discountPercent"
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_ROOM_DISCOUNT_PERCENT}
          step={1}
          required
          numeric
          defaultValue={user.roomDiscountPercent}
          label={t("discountPercent")}
          help={t("discountPercentHelp", {max: MAX_ROOM_DISCOUNT_PERCENT})}
        />
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <SpinnerIcon />
              {t("saving")}
            </>
          ) : (
            t("saveDiscount")
          )}
        </Button>
      </form>
    </section>
  );
}
