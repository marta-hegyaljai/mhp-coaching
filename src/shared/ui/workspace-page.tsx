import type {ReactNode} from "react";

import {Eyebrow, Section} from "@/shared/ui/layout";
import {PageHeader} from "@/shared/ui/page-header";

/**
 * Compact chrome for signed-in working screens (admin, account, rooms,
 * billing). Public catalogue pages keep Section + Eyebrow and the editorial
 * type scale. Do not restack eyebrow, back, title and intro as separate bands.
 */
export function WorkspacePage({
  eyebrow,
  back,
  nav,
  title,
  intro,
  action,
  children,
}: {
  eyebrow?: string;
  back?: ReactNode;
  nav?: ReactNode;
  title?: string;
  intro?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  const hasMasthead = Boolean(eyebrow || back);

  return (
    <Section size="work">
      {hasMasthead ? (
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : <span />}
          {back ? <div className="ml-auto shrink-0">{back}</div> : null}
        </div>
      ) : null}
      {nav ? <div className={hasMasthead ? "mt-3" : undefined}>{nav}</div> : null}
      {title ? (
        <PageHeader
          className={hasMasthead || nav ? "mt-4" : undefined}
          title={title}
          intro={intro}
          action={action}
        />
      ) : null}
      {children}
    </Section>
  );
}
