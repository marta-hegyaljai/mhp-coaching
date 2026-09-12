"use client";

import type {Course} from "@/features/courses/types";
import type {AppLocale} from "@/i18n/routing";
import {fieldLabelClass} from "@/shared/ui/field";

export type ProgrammeModulesFieldLabels = {
  label: string;
  hint: string;
  empty: string;
};

/**
 * Contents of a programme. Selection order is irrelevant: the public order
 * follows the catalogue order the admin already controls.
 */
export function ProgrammeModulesField({
  modules,
  selectedIds,
  locale,
  labels,
}: {
  modules: Course[];
  selectedIds: string[];
  locale: AppLocale;
  labels: ProgrammeModulesFieldLabels;
}) {
  const selected = new Set(selectedIds);

  return (
    <fieldset>
      <legend className={fieldLabelClass}>{labels.label}</legend>
      <p className="mt-1 text-xs leading-6 text-ink-subtle">{labels.hint}</p>
      {modules.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{labels.empty}</p>
      ) : (
        <div className="mt-3 max-h-72 overflow-y-auto border border-line-soft">
          {modules.map((module) => (
            <label
              key={module.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-line-soft px-3 py-2 text-sm text-ink last:border-b-0 hover:bg-hover"
            >
              <input
                type="checkbox"
                name="moduleIds"
                value={module.id}
                defaultChecked={selected.has(module.id)}
                className="size-4 shrink-0 accent-ink"
              />
              <span className="min-w-0 flex-1">{module.title[locale]}</span>
              <span className="shrink-0 text-xs text-ink-subtle">
                {module.duration[locale]}
              </span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
