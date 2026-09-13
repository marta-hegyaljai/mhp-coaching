import type {ComponentProps, ReactNode} from "react";

import {Link} from "@/i18n/navigation";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowLeftIcon} from "@/shared/ui/icons";

/**
 * The visible way back from a nested record to its list. A quiet underlined
 * line can be mistaken for a heading; this stays a 44px secondary control.
 */
export function BackLink({
  href,
  children,
  className = "",
}: {
  href: ComponentProps<typeof Link>["href"];
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={className}>
      <Link href={href} className={buttonStyles({variant: "secondary"})}>
        <ArrowLeftIcon className="transition-transform duration-150 ease-standard group-hover/button:-translate-x-1 motion-reduce:transform-none" />
        {children}
      </Link>
    </p>
  );
}
