"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {updateRoomAction} from "@/features/rooms/actions";
import {ChevronDownIcon, ChevronUpIcon, SpinnerIcon} from "@/shared/ui/icons";

const buttonClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center text-ink transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-40";

/** Reordering is one grouped secondary control so it never competes with Manage. */
export function RoomOrderControls({
  locale,
  roomId,
  isFirst,
  isLast,
}: {
  locale: string;
  roomId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = useTranslations("Rooms");

  return (
    <div className="inline-flex rounded-panel border border-ink bg-white">
      <OrderButton
        locale={locale}
        roomId={roomId}
        intent="up"
        disabled={isFirst}
        label={t("moveUp")}
      />
      <OrderButton
        locale={locale}
        roomId={roomId}
        intent="down"
        disabled={isLast}
        label={t("moveDown")}
        className="border-l border-ink"
      />
    </div>
  );
}

function OrderButton({
  locale,
  roomId,
  intent,
  disabled,
  label,
  className = "",
}: {
  locale: string;
  roomId: string;
  intent: "up" | "down";
  disabled: boolean;
  label: string;
  className?: string;
}) {
  const [state, action, pending] = useActionState(
    updateRoomAction.bind(null, locale, roomId),
    null,
  );

  return (
    <form action={action} className={className}>
      <input type="hidden" name="intent" value={intent} />
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
        ) : intent === "up" ? (
          <ChevronUpIcon />
        ) : (
          <ChevronDownIcon />
        )}
      </button>
    </form>
  );
}
