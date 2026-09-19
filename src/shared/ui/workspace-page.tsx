import type {ReactNode} from "react";

import {Eyebrow, Section} from "@/shared/ui/layout";
import {PageHeader} from "@/shared/ui/page-header";

/**
 * Compact chrome for signed-in working screens (admin, account, rooms,
 * billing). Section switching lives in `<WorkspaceFrame>`, not here. Public
 * catalogue pages keep Section + Eyebrow and the editorial type scale. Do not
 * restack eyebrow, back, title and intro as separate bands.
 */
export function WorkspacePage({
  eyebrow,
  back,
  title,
  intro,
  action,
  children,
}: {
  eyebrow?: string;
  back?: ReactNode;
  title?: string;
  intro?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  const hasMasthead = Boolean(eyebrow || back);

  return (
    <Section size="work">
      {hasMasthead ? (
        <div
          className={`flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 ${
            eyebrow && back ? "justify-between" : ""
          }`}
        >
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          {back ? <div className={eyebrow ? "ml-auto shrink-0" : "shrink-0"}>{back}</div> : null}
        </div>
      ) : null}
      {title ? (
        <PageHeader
          className={hasMasthead ? "mt-4" : undefined}
          title={title}
          intro={intro}
          action={action}
        />
      ) : null}
      {children}
    </Section>
  );
}
