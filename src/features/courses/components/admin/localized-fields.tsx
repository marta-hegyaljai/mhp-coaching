import {fieldLabelClass, fieldStyles} from "@/shared/ui/field";
import type {LocalizedJson} from "@/db/schema";

const LOCALES = [
  {code: "fr", label: "FR"},
  {code: "de", label: "DE"},
  {code: "en", label: "EN"},
] as const;

export function LocalizedFields({
  name,
  label,
  values,
  multiline = false,
  required = true,
}: {
  name: string;
  label: string;
  values: LocalizedJson;
  multiline?: boolean;
  required?: boolean;
}) {
  const controlClass = fieldStyles();

  return (
    <fieldset className="min-w-0">
      <legend className={fieldLabelClass}>{label}</legend>
      <div className="mt-2 grid gap-3 md:grid-cols-3">
        {LOCALES.map((locale) => {
          const id = `${name}-${locale.code}`;
          const fieldName = `${name}.${locale.code}`;
          const value = values[locale.code];

          return (
            <div key={locale.code}>
              <label htmlFor={id} className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                {locale.label}
              </label>
              {multiline ? (
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
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
