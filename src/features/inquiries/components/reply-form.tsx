"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {replyInquiryAction} from "@/features/inquiries/actions";
import type {AdminMessageChannel} from "@/features/inquiries/admin-message";
import {TextareaField} from "@/shared/ui/field";
import {SubmitButton} from "@/shared/ui/submit-button";

export function InquiryReplyForm({
  locale,
  inquiryId,
  channel,
}: {
  locale: string;
  inquiryId: string;
  channel: AdminMessageChannel;
}) {
  const t = useTranslations("Admin");
  const [state, action, pending] = useActionState(
    replyInquiryAction.bind(null, locale, inquiryId, channel),
    null,
  );

  return (
    <form action={action} className="space-y-4">
      {state?.ok ? <AuthNotice>{t("inquiryReplySent")}</AuthNotice> : null}
      {state?.errors?.form ? <AuthAlert>{state.errors.form}</AuthAlert> : null}
      <p className="max-w-xl text-sm leading-7 text-ink-muted">{t("inquiryReplyHelp")}</p>
      <TextareaField
        key={state?.sentAt ?? "draft"}
        id="body"
        name="body"
        label={t("inquiryReplyLabel")}
        rows={8}
        required
        minLength={10}
        maxLength={4000}
        defaultValue={state?.ok ? "" : (state?.draft ?? "")}
        error={state?.errors?.body}
      />
      <SubmitButton
        pending={pending}
        label={t("inquiryReplySend")}
        pendingLabel={t("inquiryReplySending")}
      />
    </form>
  );
}
