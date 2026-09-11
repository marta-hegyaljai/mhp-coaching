import type {ReactNode} from "react";

import {fieldLabelClass, fieldStyles} from "@/shared/ui/field";

export function AuthField({
  name,
  label,
  error,
  type = "text",
  autoComplete,
  defaultValue,
  required = true,
  readOnly = false,
  describedBy,
  hint,
  minLength,
}: {
  name: string;
  label: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  required?: boolean;
  readOnly?: boolean;
  describedBy?: string;
  hint?: string;
  minLength?: number;
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedByIds = [describedBy, hint ? hintId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div>
      <label htmlFor={name} className={fieldLabelClass}>
        {label}
      </label>
      <input
        id={name}
        name={readOnly ? undefined : name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required={readOnly ? undefined : required}
        minLength={minLength}
        readOnly={readOnly}
        aria-readonly={readOnly ? true : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByIds}
        className={`mt-2 ${fieldStyles({invalid: Boolean(error)})} ${
          readOnly ? "cursor-default" : ""
        }`}
      />
      {hint ? (
        <p id={hintId} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Failures and confirmations stay monochrome and textual; the `role` and the
 * wording carry the meaning, never a semantic colour.
 */
export function AuthAlert({children}: {children: ReactNode}) {
  return (
    <p
      role="alert"
      className="rounded-panel border-l-2 border-ink bg-shell px-4 py-3 text-sm leading-6 text-ink"
    >
      {children}
    </p>
  );
}

export function AuthNotice({children}: {children: ReactNode}) {
  return (
    <p
      role="status"
      className="rounded-panel border border-ink bg-white px-4 py-3 text-sm leading-6 text-ink"
    >
      {children}
    </p>
  );
}

export function AuthSelect({
  name,
  label,
  error,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  error?: string;
  defaultValue?: string;
  options: Array<{value: string; label: string}>;
}) {
  const errorId = `${name}-error`;

  return (
    <div>
      <label htmlFor={name} className={fieldLabelClass}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-2 ${fieldStyles({invalid: Boolean(error)})}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
