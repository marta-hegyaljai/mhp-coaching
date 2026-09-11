import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
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

const base =
  "block w-full rounded-panel border bg-white font-sans text-base text-ink outline-none transition-colors duration-150 ease-standard focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-55";

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
  /** Rendered under the control; also announced through `aria-describedby`. */
  help?: ReactNode;
  error?: string;
  children: (describedBy: string | undefined) => ReactNode;
  className?: string;
};

function FieldFrame({id, label, help, error, children, className = ""}: FieldFrameProps) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      <div className="mt-2">{children(describedBy)}</div>
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
    help?: ReactNode;
    error?: string;
    fieldClassName?: string;
  };

export function InputField({
  id,
  label,
  help,
  error,
  size,
  numeric,
  fieldClassName,
  ...input
}: InputFieldProps) {
  return (
    <FieldFrame id={id} label={label} help={help} error={error} className={fieldClassName}>
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
