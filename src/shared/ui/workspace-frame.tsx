import type {ReactNode} from "react";

import {Eyebrow} from "./layout";
import type {WorkspaceNavModel} from "./workspace-nav";
import {WorkspaceNavList} from "./workspace-nav-list";
import {WorkspaceNavMobile} from "./workspace-nav-mobile";

/**
 * Signed-in working chrome: a left rail from `lg`, a labeled section sheet on
 * a phone. The product header keeps the booking action; this frame only moves
 * between destinations inside one workspace.
 */
export function WorkspaceFrame({
  nav,
  fillViewport = false,
  children,
}: {
  nav: WorkspaceNavModel;
  fillViewport?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex ${
        fillViewport ? "min-h-0 flex-1" : ""
      } flex-col lg:flex-row`}
    >
      <aside
        className={`hidden w-52 shrink-0 flex-col border-r border-ink bg-white lg:flex ${
          fillViewport
            ? "min-h-0 overflow-y-auto"
            : "lg:sticky lg:top-[var(--mhp-header-height)] lg:h-[calc(100dvh-var(--mhp-header-height))] lg:overflow-y-auto"
        }`}
      >
        <div className="shrink-0 border-b border-line px-3 py-3">
          <Eyebrow>{nav.eyebrow}</Eyebrow>
        </div>
        <WorkspaceNavList nav={nav} />
      </aside>
      <div
        className={`min-w-0 flex-1 ${
          fillViewport ? "flex min-h-0 flex-col" : ""
        }`}
      >
        <WorkspaceNavMobile nav={nav} />
        {fillViewport ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
