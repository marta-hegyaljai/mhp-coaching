import {LockIcon} from "@/shared/ui/icons";

const methods = ["TWINT", "Visa", "Mastercard"];

/**
 * Reassurance row shown next to booking calls to action. Brand names stay
 * untranslated; the surrounding note is passed in already localized.
 */
export function PaymentMethods({
  note,
  className = "",
}: {
  note?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}>
      <ul className="flex flex-wrap items-center gap-1.5">
        {methods.map((method) => (
          <li
            key={method}
            className="rounded-full border border-line bg-parchment px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-muted"
          >
            {method}
          </li>
        ))}
      </ul>
      {note ? (
        <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
          <LockIcon className="h-3.5 w-3.5" />
          {note}
        </p>
      ) : null}
    </div>
  );
}
