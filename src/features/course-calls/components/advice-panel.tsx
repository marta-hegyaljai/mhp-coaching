import {getTranslations} from "next-intl/server";

import {adviceHref, type AdviceQuery, type AdviceTarget} from "@/features/course-calls/advice-route";
import type {AdviceView} from "@/features/course-calls/advice-view";
import {CallScheduler} from "@/features/course-calls/components/call-scheduler";
import {InquiryComposer} from "@/features/course-calls/components/inquiry-composer";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {SegmentedLinks} from "@/shared/ui/segmented-links";

/**
 * The call/write switch and the matching form. Both advice pages share this so
 * the booking rules, slot grid and validation can never drift apart; each page
 * keeps only its own breadcrumbs and heading copy.
 */
export async function AdvicePanel({
  locale,
  target,
  query,
  view,
  courseId,
}: {
  locale: AppLocale;
  target: AdviceTarget;
  query: AdviceQuery;
  view: AdviceView;
  /** `null` on the standalone page: no course is attached to the request. */
  courseId: string | null;
}) {
  const t = await getTranslations({locale, namespace: "CourseAdvice"});
  const writing = query.mode === "write";
  const callHref = adviceHref(target, {date: view.selectedDate});
  const writeHref = adviceHref(target, {mode: "write"});

  return (
    <>
      <div className="mt-8">
        <SegmentedLinks
          label={t("modeLabel")}
          items={[
            {key: "call", href: callHref, label: t("modeCall"), current: !writing},
            {key: "write", href: writeHref, label: t("modeWrite"), current: writing},
          ]}
        />
      </div>

      <div className="mt-10 sm:mt-12">
        {writing ? (
          <InquiryComposer
            locale={locale}
            courseId={courseId}
            {...(view.defaults ? {defaults: view.defaults} : {})}
          />
        ) : (
          <CallScheduler
            locale={locale}
            courseId={courseId}
            writeHref={writeHref}
            selectedDate={view.selectedDate}
            availableDates={view.availableDates}
            slotsByDate={view.slotsByDate}
            minDate={view.minDate}
            maxDate={view.maxDate}
            {...(view.defaults ? {defaults: view.defaults} : {})}
          />
        )}
      </div>

      {writing ? (
        <p className="mt-10 max-w-xl text-sm leading-6 text-ink-muted">
          {t("preferCall")}{" "}
          <Link
            href={callHref}
            className="font-medium text-ink underline underline-offset-4"
          >
            {t("modeCall")}
          </Link>
        </p>
      ) : null}
    </>
  );
}
