import {fieldLabelClass, fieldStyles, type FieldSize} from "@/shared/ui/field";
import type {LocalizedJson} from "@/db/schema";

const LOCALES = [
  {code: "fr", label: "FR"},
  {code: "de", label: "DE"},
  {code: "en", label: "EN"},
] as const;

/**
 * `stacked` gives each locale a full-width control for long editorial copy.
 * `inline` moves the locale code beside its input, which keeps a dense
 * operational editor short enough to stay usable on a phone.
 */
export type LocalizedFieldsLayout = "stacked" | "inline";

export function LocalizedFields({
  name,
  label,
  values,
  multiline = false,
  required = true,
  layout = "stacked",
  size,
  idPrefix,
}: {
  name: string;
  label: string;
  values: LocalizedJson;
  multiline?: boolean;
  required?: boolean;
  layout?: LocalizedFieldsLayout;
  size?: FieldSize;
  /** Set it when the same field name appears more than once on a page. */
  idPrefix?: string;
}) {
  const controlClass = fieldStyles({size});
  const inline = layout === "inline";
  const prefix = idPrefix ?? name;

  return (
    <fieldset className="min-w-0">
      <legend className={fieldLabelClass}>{label}</legend>
      <div className={`mt-2 grid gap-3 ${inline ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-3"}`}>
        {LOCALES.map((locale) => {
          const id = `${prefix}-${locale.code}`;
          const fieldName = `${name}.${locale.code}`;
          const value = values[locale.code] ?? "";
          const control = multiline ? (
            <textarea
              id={id}
              name={fieldName}
              defaultValue={value}
              required={required}
              rows={5}
              className={`${controlClass} min-h-32 py-2`}
            />
          ) : (
            <input
              id={id}
              name={fieldName}
              defaultValue={value}
              required={required}
              className={controlClass}
            />
          );

          if (inline) {
            return (
              <div key={locale.code} className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-2">
                <label
                  htmlFor={id}
                  className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-muted"
                >
                  {locale.label}
                </label>
                {control}
              </div>
            );
          }

          return (
            <div key={locale.code}>
              <label htmlFor={id} className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                {locale.label}
              </label>
              {control}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
