import {getTranslations} from "next-intl/server";

import {startPaymentMethodSetupAction} from "@/features/rooms/billing-actions";
import {formatPaymentMethodLabel, type SavedPaymentMethod} from "@/features/payments/billing-method";
import {Button} from "@/shared/ui/button";
import {Panel} from "@/shared/ui/panel";
import {SectionLabel} from "@/shared/ui/section-label";
import {StatusLabel} from "@/shared/ui/status-label";

export async function PaymentMethodPanel({
  method,
  locale,
}: {
  method: SavedPaymentMethod | null;
  locale: string;
}) {
  const t = await getTranslations("Rooms");

  return (
    <section className="mt-12 max-w-xl">
      <h2 className="font-serif text-subheading">{t("paymentMethodTitle")}</h2>
      <p className="mt-3 text-sm leading-7 text-ink-muted">{t("paymentMethodHelp")}</p>
      <Panel className="mt-5" padding="sm">
        {method ? (
          <>
            <StatusLabel>{t("paymentMethodSaved")}</StatusLabel>
            <p className="mt-3 font-sans text-sm tabular-nums leading-6">
              {formatPaymentMethodLabel(method)}
            </p>
            <SectionLabel className="mt-4">{t("paymentMethodSafeNote")}</SectionLabel>
          </>
        ) : (
          <>
            <StatusLabel tone="muted">{t("paymentMethodMissing")}</StatusLabel>
            <p className="mt-3 text-sm leading-6 text-ink-muted">{t("paymentMethodMissingHelp")}</p>
          </>
        )}
        <form action={startPaymentMethodSetupAction.bind(null, locale)} className="mt-6">
          <Button type="submit">
            {method ? t("paymentMethodReplace") : t("paymentMethodAdd")}
          </Button>
        </form>
      </Panel>
    </section>
  );
}
