"use client";

export function RoomDescriptionField({
  label,
  defaultValue,
}: {
  label: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor="description" className="block text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id="description"
        name="description"
        rows={4}
        defaultValue={defaultValue}
        className="mt-2 block w-full rounded-panel border border-line bg-white px-3.5 py-3 text-base text-ink focus:border-ink focus:outline-none"
      />
    </div>
  );
}
