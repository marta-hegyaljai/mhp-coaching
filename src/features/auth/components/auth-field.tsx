import type {ReactNode} from "react";

export function AuthField({
  name,
  label,
  error,
  type = "text",
  autoComplete,
  defaultValue,
}: {
  name: string;
  label: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
}) {
  const errorId = `${name}-error`;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-2 block min-h-12 w-full rounded-panel border bg-white px-3.5 text-base text-ink focus:border-ink focus:outline-none ${
          error ? "border-bronze" : "border-line"
        }`}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-bronze">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AuthAlert({children}: {children: ReactNode}) {
  return (
    <p role="alert" className="border border-bronze/45 px-4 py-3 text-sm text-bronze">
      {children}
    </p>
  );
}

export function AuthNotice({children}: {children: ReactNode}) {
  return (
    <p role="status" className="border border-ink bg-white px-4 py-3 text-sm text-ink">
      {children}
    </p>
  );
}
