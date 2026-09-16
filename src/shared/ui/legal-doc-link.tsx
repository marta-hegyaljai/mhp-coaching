import type {ReactNode} from "react";

import {Link} from "@/i18n/navigation";

type LegalDocHref =
  | "/legal/imprint"
  | "/legal/privacy"
  | "/legal/terms"
  | "/legal/terms-of-use"
  | "/legal/copyright";

export function LegalDocLink({
  href,
  className,
  children,
}: {
  href: LegalDocHref;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </Link>
  );
}
