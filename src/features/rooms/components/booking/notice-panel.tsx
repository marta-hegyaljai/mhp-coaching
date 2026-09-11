import {Panel} from "@/shared/ui/panel";
import {Price} from "@/shared/ui/price";
import {SectionLabel} from "@/shared/ui/section-label";

/**
 * A consequence the reader must take in before acting — never an alert, so it
 * keeps the neutral grey surface the design language reserves for emphasis.
 */
export function NoticePanel({
  label,
  message,
  amount,
}: {
  label: string;
  message: string;
  amount?: string;
}) {
  return (
    <Panel tone="shell">
      <SectionLabel className="text-ink">{label}</SectionLabel>
      <p className="mt-3 text-sm leading-7 text-ink">{message}</p>
      {amount ? (
        <p className="mt-4">
          <Price size="md">{amount}</Price>
        </p>
      ) : null}
    </Panel>
  );
}
