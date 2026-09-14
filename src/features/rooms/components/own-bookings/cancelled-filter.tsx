"use client";

export function OwnBookingCancelledFilter({
  action,
  checked,
  label,
  applyLabel,
  reserved,
  cancelledNotice,
}: {
  action: string;
  checked: boolean;
  label: string;
  applyLabel: string;
  reserved: boolean;
  cancelledNotice: boolean;
}) {
  return (
    <form
      method="get"
      action={action}
      className="flex min-h-11 items-center"
      onChange={(event) => {
        event.currentTarget.requestSubmit();
      }}
    >
      {reserved ? <input type="hidden" name="reserved" value="1" /> : null}
      {cancelledNotice ? <input type="hidden" name="cancelled" value="1" /> : null}
      <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          name="status"
          value="all"
          defaultChecked={checked}
          className="h-4 w-4 rounded-panel border-ink"
        />
        {label}
      </label>
      <button type="submit" className="sr-only">
        {applyLabel}
      </button>
    </form>
  );
}
