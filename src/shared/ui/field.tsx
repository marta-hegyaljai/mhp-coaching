import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export type FieldSize = "sm" | "md";

/**
 * One control geometry for the whole product: `md` for data entry, `sm` for
 * the compact filter bars on operational screens. Both clear 44px.
 */
const sizes: Record<FieldSize, string> = {
  sm: "min-h-11 px-3",
  md: "min-h-12 px-3.5",
};

/** One ink border on focus — never stack an outline ring on top of the frame. */
export const controlFocusClass =
  "outline-none focus:border-ink focus-visible:border-ink";

const base =
  `block w-full rounded-panel border bg-white font-sans text-base text-ink transition-colors duration-150 ease-standard disabled:cursor-not-allowed disabled:opacity-55 ${controlFocusClass}`;

type StyleOptions = {
  size?: FieldSize;
  /** Times, dates and amounts align in columns only with tabular figures. */
  numeric?: boolean;
  invalid?: boolean;
};

export function fieldStyles({
  size = "md",
  numeric = false,
  invalid = false,
}: StyleOptions = {}): string {
  return [
    base,
    sizes[size],
    numeric ? "tabular-nums" : "",
    invalid ? "border-ink" : "border-line",
  ]
    .filter(Boolean)
    .join(" ");
}

export const fieldLabelClass = "block text-sm font-medium text-ink";

type FieldFrameProps = {
  id: string;
  label: string;
  /**
   * Keeps the label for assistive technology only. Reserved for single-control
   * toolbars where the placeholder repeats the label; data entry keeps it
   * visible.
   */
  labelHidden?: boolean;
  /** Rendered under the control; also announced through `aria-describedby`. */
  help?: ReactNode;
  error?: string;
  children: (describedBy: string | undefined) => ReactNode;
  className?: string;
};

function FieldFrame({
  id,
  label,
  labelHidden = false,
  help,
  error,
  children,
  className = "",
}: FieldFrameProps) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={labelHidden ? "sr-only" : fieldLabelClass}>
        {label}
      </label>
      <div className={labelHidden ? "" : "mt-2"}>{children(describedBy)}</div>
      {help ? (
        <p id={helpId} className="mt-2 text-sm leading-6 text-ink-muted">
          {help}
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

// The native `size` attribute is shadowed by the design-system size scale.
type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className" | "size"> &
  StyleOptions & {
    id: string;
    label: string;
    help?: ReactNode;
    error?: string;
    fieldClassName?: string;
    children: ReactNode;
  };

export function SelectField({
  id,
  label,
  help,
  error,
  size,
  numeric,
  fieldClassName,
  children,
  ...select
}: SelectFieldProps) {
  return (
    <FieldFrame id={id} label={label} help={help} error={error} className={fieldClassName}>
      {(describedBy) => (
        <select
          {...select}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={fieldStyles({size, numeric, invalid: Boolean(error)})}
        >
          {children}
        </select>
      )}
    </FieldFrame>
  );
}

type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "size"> &
  StyleOptions & {
    id: string;
    label: string;
    labelHidden?: boolean;
    help?: ReactNode;
    error?: string;
    fieldClassName?: string;
  };

export function InputField({
  id,
  label,
  labelHidden,
  help,
  error,
  size,
  numeric,
  fieldClassName,
  ...input
}: InputFieldProps) {
  return (
    <FieldFrame
      id={id}
      label={label}
      labelHidden={labelHidden}
      help={help}
      error={error}
      className={fieldClassName}
    >
      {(describedBy) => (
        <input
          {...input}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={fieldStyles({size, numeric, invalid: Boolean(error)})}
        />
      )}
    </FieldFrame>
  );
}

type TextareaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className"> &
  StyleOptions & {
    id: string;
    label: string;
    help?: ReactNode;
    error?: string;
    fieldClassName?: string;
  };

export function TextareaField({
  id,
  label,
  help,
  error,
  size,
  numeric,
  fieldClassName,
  rows = 4,
  ...textarea
}: TextareaFieldProps) {
  return (
    <FieldFrame id={id} label={label} help={help} error={error} className={fieldClassName}>
      {(describedBy) => (
        <textarea
          {...textarea}
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={`${fieldStyles({size, numeric, invalid: Boolean(error)})} min-h-24 py-3`}
        />
      )}
    </FieldFrame>
  );
}
