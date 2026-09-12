type IconProps = {
  className?: string;
};

const base = "h-4 w-4 shrink-0";

export function ArrowRightIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M2.5 8h11" />
      <path d="M9.5 4l4 4-4 4" />
    </svg>
  );
}

export function CheckIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </svg>
  );
}

export function LockIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <rect x="3.25" y="7" width="9.5" height="6.5" rx="1.5" />
      <path d="M5.75 7V5.25a2.25 2.25 0 014.5 0V7" />
    </svg>
  );
}

export function CalendarIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2" />
    </svg>
  );
}

export function PinIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M8 14s4.5-4.35 4.5-7.5a4.5 4.5 0 10-9 0C3.5 9.65 8 14 8 14z" />
      <circle cx="8" cy="6.5" r="1.6" />
    </svg>
  );
}

export function SearchIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  );
}

export function ChevronLeftIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M10 3.5L5.5 8l4.5 4.5" />
    </svg>
  );
}

export function ChevronRightIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M6 3.5L10.5 8 6 12.5" />
    </svg>
  );
}

export function ChevronUpIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M3.5 10L8 5.5l4.5 4.5" />
    </svg>
  );
}

export function ChevronDownIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M3.5 6L8 10.5 12.5 6" />
    </svg>
  );
}

export function MenuIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
    </svg>
  );
}

export function CloseIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export function DownloadIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M8 2.5v7.5M4.75 7.25L8 10.5l3.25-3.25M3 13h10" />
    </svg>
  );
}

export function SpinnerIcon({className = ""}: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
      className={`${base} animate-spin ${className}`}
    >
      <circle cx="8" cy="8" r="6" opacity="0.3" />
      <path d="M14 8a6 6 0 00-6-6" />
    </svg>
  );
}
