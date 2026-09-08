import type {ReactNode} from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export function Container({children, className = ""}: ContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10 ${className}`}>
      {children}
    </div>
  );
}

type SectionProps = ContainerProps & {
  tone?: "base" | "shell";
  size?: "sm" | "md" | "lg";
  containerClassName?: string;
  id?: string;
  ariaLabelledBy?: string;
};

const paddings = {
  sm: "py-10 sm:py-12",
  md: "py-14 sm:py-20",
  lg: "py-16 sm:py-24 lg:py-28",
} as const;

export function Section({
  children,
  tone = "base",
  size = "md",
  className = "",
  containerClassName = "",
  id,
  ariaLabelledBy,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      // Anchored sections clear the sticky header when jumped to.
      className={`${tone === "shell" ? "bg-shell" : ""} ${id ? "scroll-mt-20" : ""} ${paddings[size]} ${className}`}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export function Eyebrow({children, className = ""}: ContainerProps) {
  return (
    <p
      className={`text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-bronze ${className}`}
    >
      {children}
    </p>
  );
}
