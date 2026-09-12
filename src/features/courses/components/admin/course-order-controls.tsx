"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {reorderCourseAction} from "@/features/courses/admin";
import {ChevronDownIcon, ChevronUpIcon, SpinnerIcon} from "@/shared/ui/icons";

const buttonClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center text-ink transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-40";

export function CourseOrderControls({
  locale,
  courseId,
  isFirst,
  isLast,
}: {
  locale: string;
  courseId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = useTranslations("Admin");

  return (
    <div className="inline-flex rounded-panel border border-ink bg-white">
      <OrderButton
        locale={locale}
        courseId={courseId}
        direction="up"
        disabled={isFirst}
        label={t("coursesMoveUp")}
      />
      <OrderButton
        locale={locale}
        courseId={courseId}
        direction="down"
        disabled={isLast}
        label={t("coursesMoveDown")}
        className="border-l border-ink"
      />
    </div>
  );
}

function OrderButton({
  locale,
  courseId,
  direction,
  disabled,
  label,
  className = "",
}: {
  locale: string;
  courseId: string;
  direction: "up" | "down";
  disabled: boolean;
  label: string;
  className?: string;
}) {
  const [state, action, pending] = useActionState(
    reorderCourseAction.bind(null, locale),
    null,
  );

  return (
    <form action={action} className={className}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="direction" value={direction} />
      {state?.error ? (
        <p className="sr-only" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={disabled || pending}
        aria-label={label}
        title={label}
        className={buttonClass}
      >
        {pending ? (
          <SpinnerIcon />
        ) : direction === "up" ? (
          <ChevronUpIcon />
        ) : (
          <ChevronDownIcon />
        )}
      </button>
    </form>
  );
}
