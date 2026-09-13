"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";

import {AuthAlert, AuthNotice} from "@/features/auth/components/auth-field";
import {createBlockAction, removeBlockAction} from "@/features/rooms/actions";
import {Button} from "@/shared/ui/button";
import {DateField} from "@/shared/ui/date-field";
import {fieldStyles} from "@/shared/ui/field";
import {SectionLabel} from "@/shared/ui/section-label";
import {SubmitButton} from "@/shared/ui/submit-button";

export type RoomBlockView = {id: string; label: string; reason: string};

const controlClass = `mt-2 ${fieldStyles()}`;

export function RoomBlockForm({
  locale,
  roomId,
  blocks,
}: {
  locale: string;
  roomId: string;
  blocks: RoomBlockView[];
}) {
  const t = useTranslations("Rooms");
  const [state, action, pending] = useActionState(
    createBlockAction.bind(null, locale, roomId),
    null,
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-serif text-subheading">{t("blocksTitle")}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{t("blocksIntro")}</p>
      </div>

      {blocks.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("noBlocks")}</p>
      ) : (
        <ul className="space-y-3">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-ink bg-white px-4 py-3"
            >
              <div>
                <p className="font-sans text-sm font-semibold tabular-nums">{block.label}</p>
                <p className="mt-1 text-sm text-ink-muted">{block.reason}</p>
              </div>
              <form action={removeBlockAction.bind(null, locale, roomId, block.id)}>
                <Button type="submit" variant="secondary">
                  {t("removeBlock")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="max-w-xl rounded-panel border border-ink bg-white p-5 sm:p-6">
        <SectionLabel>{t("addBlock")}</SectionLabel>

        <form action={action} className="mt-5 space-y-5">
          {state?.error ? <AuthAlert>{state.error}</AuthAlert> : null}
          {state?.conflicts?.length ? (
            <AuthAlert>{state.conflicts.join(" · ")}</AuthAlert>
          ) : null}
          {state?.ok ? <AuthNotice>{t("saved")}</AuthNotice> : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <ZurichDateTimeFields
              dateId="startDate"
              timeId="startTime"
              dateName="startDate"
              timeName="startTime"
              label={t("blockStart")}
            />
            <ZurichDateTimeFields
              dateId="endDate"
              timeId="endTime"
              dateName="endDate"
              timeName="endTime"
              label={t("blockEnd")}
            />
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-ink">
              {t("blockReason")}
            </label>
            <input id="reason" name="reason" required maxLength={200} className={controlClass} />
          </div>

          <SubmitButton
            pending={pending}
            label={t("addBlock")}
            pendingLabel={t("addingBlock")}
          />
        </form>
      </div>
    </section>
  );
}

function ZurichDateTimeFields({
  dateId,
  timeId,
  dateName,
  timeName,
  label,
}: {
  dateId: string;
  timeId: string;
  dateName: string;
  timeName: string;
  label: string;
}) {
  return (
    <div>
      <p className="block text-sm font-medium text-ink">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <DateField
          id={dateId}
          name={dateName}
          aria-label={label}
          required
        />
        <input
          id={timeId}
          name={timeName}
          type="time"
          required
          step={900}
          aria-label={label}
          className={controlClass}
        />
      </div>
    </div>
  );
}
